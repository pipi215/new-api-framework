package service

import (
	"bytes"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/QuantumNous/new-api/setting"
)

// USAD 充值网关上游接口封装。
// 文档：USAD 充值查询接口文档（对外）
//   - POST {ApiUrl}/openapi/deposit/address  查询充值地址
//   - POST {ApiUrl}/openapi/deposit/verify    按 txid 核对充值
//
// 签名算法（文档 §1.2）：
//   sign = HmacSHA256Hex(accessKey + timestamp, apiSecret)  // 小写十六进制
//   timestamp 秒或毫秒均可；时间戳窗口 |now - timestamp| ≤ 5s

// usadTimestampWindowSeconds 防重放时间窗口（秒）。
const usadTimestampWindowSeconds = 5

// UsadSign 计算 USAD 请求签名：HmacSHA256Hex(accessKey + timestamp, apiSecret)。
func UsadSign(accessKey, timestamp, apiSecret string) string {
	mac := hmac.New(sha256.New, []byte(apiSecret))
	mac.Write([]byte(accessKey + timestamp))
	return hex.EncodeToString(mac.Sum(nil))
}

// usadOpenResult 是上游统一响应结构 OpenResult<T>。
type usadOpenResult struct {
	Code string          `json:"code"`
	Msg  string          `json:"msg"`
	Data json.RawMessage `json:"data"`
}

// UsadAddressData /openapi/deposit/address 响应 data。
type UsadAddressData struct {
	Symbol          string `json:"symbol"`
	Mainnet         string `json:"mainnet"`
	AddressStr      string `json:"addressStr"`
	DepositConfirm  int    `json:"depositConfirm"`
	AddressQRCode   string `json:"addressQRCode"`
	Memo            string `json:"memo"`
}

// UsadVerifyData /openapi/deposit/verify 响应 data。
type UsadVerifyData struct {
	Txid      string `json:"txid"`
	Symbol    string `json:"symbol"`
	Amount    string `json:"amount"`
	Confirmed bool   `json:"confirmed"`
}

// UsadErr 上游返回的错误，携带 code 便于调用方区分 -3004/-3005 等。
type UsadErr struct {
	Code string
	Msg  string
}

func (e *UsadErr) Error() string {
	return fmt.Sprintf("usad upstream error: code=%s msg=%s", e.Code, e.Msg)
}

// usadRequest 组装并发送一个带签名的 USAD 请求，解析统一响应。
func usadRequest(url string, body map[string]string, result interface{}) error {
	accessKey := strings.TrimSpace(setting.UsadAccessKey)
	apiSecret := strings.TrimSpace(setting.UsadApiSecret)
	if accessKey == "" || apiSecret == "" {
		return fmt.Errorf("USAD 凭证未配置")
	}

	// 文档要求 timestamp 与服务器时间偏差 ≤ 5s，使用毫秒时间戳。
	timestamp := strconv.FormatInt(time.Now().UnixMilli(), 10)
	sign := UsadSign(accessKey, timestamp, apiSecret)

	reqBody := make(map[string]string, len(body)+3)
	for k, v := range body {
		reqBody[k] = v
	}
	reqBody["accessKey"] = accessKey
	reqBody["timestamp"] = timestamp
	reqBody["sign"] = sign

	raw, err := json.Marshal(reqBody)
	if err != nil {
		return fmt.Errorf("USAD 序列化请求失败: %w", err)
	}

	req, err := http.NewRequest(http.MethodPost, url, bytes.NewReader(raw))
	if err != nil {
		return fmt.Errorf("USAD 构造请求失败: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 15 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("USAD 请求失败: %w", err)
	}
	defer resp.Body.Close()

	respBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("USAD 读取响应失败: %w", err)
	}

	var openResult usadOpenResult
	if err := json.Unmarshal(respBytes, &openResult); err != nil {
		return fmt.Errorf("USAD 解析响应失败: raw=%s err=%w", string(respBytes), err)
	}

	if openResult.Code != "0" {
		return &UsadErr{Code: openResult.Code, Msg: openResult.Msg}
	}

	if result == nil || len(openResult.Data) == 0 {
		return nil
	}
	if err := json.Unmarshal(openResult.Data, result); err != nil {
		return fmt.Errorf("USAD 解析 data 失败: raw=%s err=%w", string(openResult.Data), err)
	}
	return nil
}

// UsadQueryAddress 查询 USAD 充值地址。
func UsadQueryAddress() (*UsadAddressData, error) {
	apiUrl := strings.TrimRight(strings.TrimSpace(setting.UsadApiUrl), "/")
	if apiUrl == "" {
		return nil, fmt.Errorf("USAD 网关地址未配置")
	}
	var data UsadAddressData
	if err := usadRequest(apiUrl+"/openapi/deposit/address", map[string]string{}, &data); err != nil {
		return nil, err
	}
	return &data, nil
}

// UsadVerifyByTxid 按 txid 核对 USAD 充值到账，返回到账数量（USAD 字符串）。
func UsadVerifyByTxid(txid string) (*UsadVerifyData, error) {
	apiUrl := strings.TrimRight(strings.TrimSpace(setting.UsadApiUrl), "/")
	if apiUrl == "" {
		return nil, fmt.Errorf("USAD 网关地址未配置")
	}
	txid = strings.TrimSpace(txid)
	if txid == "" {
		return nil, fmt.Errorf("txid 不能为空")
	}
	var data UsadVerifyData
	if err := usadRequest(apiUrl+"/openapi/deposit/verify", map[string]string{"txid": txid}, &data); err != nil {
		return nil, err
	}
	return &data, nil
}
