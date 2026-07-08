package controller

import (
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/logger"
	"github.com/QuantumNous/new-api/model"
	"github.com/QuantumNous/new-api/service"
	"github.com/QuantumNous/new-api/setting"

	"github.com/gin-gonic/gin"
	"github.com/shopspring/decimal"
	"github.com/thanhpk/randstr"
)

// USAD 充值流程（文档 §4 接入建议）：
//  1. RequestUSADAddress — 调上游 /openapi/deposit/address 拿到 USAD 充值地址，
//     同时在本系统创建一笔 pending 订单（trade_no 用于后续核对幂等）。
//  2. 用户在链上向该地址转账 USAD。
//  3. RequestUSADVerify — 用户提交链上 txid，后端调上游 /openapi/deposit/verify
//     核对到账；核对成功后按返回的 amount 换算额度并发放。
//
// 与 Stripe / Waffo Pancake 等托管结账渠道不同，USAD 没有「拉起支付 URL」，
// 而是地址 + txid 两段式，因此前端需要对应的两步交互。

// usadVerifyRequest 用户提交 txid 核对到账。
type usadVerifyRequest struct {
	TradeNo string `json:"trade_no"`
	Txid    string `json:"txid"`
}

// RequestUSADAddress 创建 USAD 充值订单并返回链上充值地址。
// 前端选择 USAD 后调用，拿到地址展示给用户转账。
func RequestUSADAddress(c *gin.Context) {
	if !isUSADTopUpEnabled() {
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "USAD 配置不完整"})
		return
	}

	id := c.GetInt("id")
	if id <= 0 {
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "用户未登录"})
		return
	}

	// 调上游查询该用户的 USAD 充值地址
	address, err := service.UsadQueryAddress()
	if err != nil {
		logger.LogError(c.Request.Context(), fmt.Sprintf("USAD 查询充值地址失败 user_id=%d error=%q", id, err.Error()))
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "获取充值地址失败"})
		return
	}

	// 创建 pending 订单，Amount 先置 0，核对到账后按实际数量发放
	tradeNo := fmt.Sprintf("USAD-%d-%d-%s", id, time.Now().UnixMilli(), randstr.String(6))
	topUp := &model.TopUp{
		UserId:          id,
		Amount:          0,
		Money:           0,
		TradeNo:         tradeNo,
		PaymentMethod:   model.PaymentMethodUSAD,
		PaymentProvider: model.PaymentProviderUSAD,
		CreateTime:      time.Now().Unix(),
		Status:          common.TopUpStatusPending,
	}
	if err := topUp.Insert(); err != nil {
		logger.LogError(c.Request.Context(), fmt.Sprintf("USAD 创建充值订单失败 user_id=%d trade_no=%s error=%q", id, tradeNo, err.Error()))
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "创建订单失败"})
		return
	}
	logger.LogInfo(c.Request.Context(), fmt.Sprintf("USAD 充值订单创建成功 user_id=%d trade_no=%s address=%s", id, tradeNo, address.AddressStr))

	c.JSON(http.StatusOK, gin.H{
		"message": "success",
		"data": gin.H{
			"order_id":         tradeNo,
			"symbol":           address.Symbol,
			"mainnet":          address.Mainnet,
			"address":          address.AddressStr,
			"deposit_confirm":  address.DepositConfirm,
			"address_qr_code":  address.AddressQRCode,
			"memo":             address.Memo,
			"min_topup":        setting.UsadMinTopUp,
			"unit_price":       setting.UsadUnitPrice,
		},
	})
}

// RequestUSADVerify 凭 txid 核对 USAD 充值到账并发放额度。
// 单个 txid 全局仅可核对成功一次（由上游保证），重复核对返回 -3004。
func RequestUSADVerify(c *gin.Context) {
	if !isUSADTopUpEnabled() {
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "USAD 配置不完整"})
		return
	}

	var req usadVerifyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "参数错误"})
		return
	}
	tradeNo := strings.TrimSpace(req.TradeNo)
	txid := strings.TrimSpace(req.Txid)
	if tradeNo == "" || txid == "" {
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "订单号或 txid 不能为空"})
		return
	}

	// 订单必须存在且属于当前用户、为 USAD 渠道、状态为 pending
	topUp := model.GetTopUpByTradeNo(tradeNo)
	if topUp == nil {
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "充值订单不存在"})
		return
	}
	userId := c.GetInt("id")
	if topUp.UserId != userId {
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "订单不存在"})
		return
	}
	if topUp.PaymentProvider != model.PaymentProviderUSAD {
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "订单渠道不匹配"})
		return
	}
	if topUp.Status == common.TopUpStatusSuccess {
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "该订单已完成，请勿重复核对"})
		return
	}
	if topUp.Status != common.TopUpStatusPending {
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "订单状态异常，无法核对"})
		return
	}

	// 锁定该订单，避免并发重复提交 txid
	LockOrder(tradeNo)
	defer UnlockOrder(tradeNo)

	// 再次取订单（加锁后状态可能已变）
	topUp = model.GetTopUpByTradeNo(tradeNo)
	if topUp == nil || topUp.Status == common.TopUpStatusSuccess {
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "该订单已完成，请勿重复核对"})
		return
	}

	// 调上游核对到账
	verify, err := service.UsadVerifyByTxid(txid)
	if err != nil {
		ue, ok := err.(*service.UsadErr)
		if ok {
			switch ue.Code {
			case "-3005":
				c.JSON(http.StatusOK, gin.H{"message": "error", "data": "未查询到对应的充值记录，请确认 txid 正确且链上已到账"})
			case "-3004":
				c.JSON(http.StatusOK, gin.H{"message": "error", "data": "该 txid 已核对，不可重复核对"})
			default:
				logger.LogError(c.Request.Context(), fmt.Sprintf("USAD 核对失败 trade_no=%s txid=%s code=%s msg=%s", tradeNo, txid, ue.Code, ue.Msg))
				c.JSON(http.StatusOK, gin.H{"message": "error", "data": "核对失败：" + ue.Msg})
			}
			return
		}
		logger.LogError(c.Request.Context(), fmt.Sprintf("USAD 核对异常 trade_no=%s txid=%s error=%q", tradeNo, txid, err.Error()))
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "核对失败，请稍后重试"})
		return
	}

	// 解析到账数量并换算额度
	usadAmount, perr := strconv.ParseFloat(verify.Amount, 64)
	if perr != nil || usadAmount <= 0 {
		logger.LogError(c.Request.Context(), fmt.Sprintf("USAD 核对返回金额无效 trade_no=%s txid=%s amount=%q", tradeNo, txid, verify.Amount))
		// 金额无效时把订单标记失败，避免悬挂
		_ = model.UpdatePendingTopUpStatus(tradeNo, model.PaymentProviderUSAD, common.TopUpStatusFailed)
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "核对返回金额无效"})
		return
	}

	// 最低充值数量校验（按 USAD 数量）
	if setting.UsadMinTopUp > 0 && usadAmount < float64(setting.UsadMinTopUp) {
		_ = model.UpdatePendingTopUpStatus(tradeNo, model.PaymentProviderUSAD, common.TopUpStatusFailed)
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": fmt.Sprintf("到账数量 %.8f 低于最低充值 %d USAD", usadAmount, setting.UsadMinTopUp)})
		return
	}

	if err := model.RechargeUSAD(tradeNo, usadAmount, c.ClientIP()); err != nil {
		logger.LogError(c.Request.Context(), fmt.Sprintf("USAD 发放额度失败 trade_no=%s txid=%s amount=%s error=%q", tradeNo, txid, verify.Amount, err.Error()))
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "充值失败，请稍后重试"})
		return
	}

	// 读取订单确定最终发放额度
	topUp = model.GetTopUpByTradeNo(tradeNo)
	quotaToAdd := 0
	if topUp != nil {
		quotaToAdd = int(decimal.NewFromFloat(usadAmount).Mul(decimal.NewFromFloat(common.QuotaPerUnit)).IntPart())
	}
	logger.LogInfo(c.Request.Context(), fmt.Sprintf("USAD 充值成功 user_id=%d trade_no=%s txid=%s amount=%s quota=%d", userId, tradeNo, txid, verify.Amount, quotaToAdd))

	c.JSON(http.StatusOK, gin.H{
		"message": "success",
		"data": gin.H{
			"order_id": tradeNo,
			"txid":     verify.Txid,
			"amount":   verify.Amount,
			"quota":    quotaToAdd,
		},
	})
}
