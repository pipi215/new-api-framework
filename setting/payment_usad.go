package setting

// USAD 充值网关配置。USAD 是一个链上 USAD 充值渠道，流程为：
// 1) 调用 /openapi/deposit/address 查询充值地址
// 2) 用户在链上转账
// 3) 凭 txid 调用 /openapi/deposit/verify 核对到账并加额度
//
// accessKey / apiSecret 由平台对接人线下申请（服务端对服务端），
// 因此此处为全局平台级配置，由管理员在后台「支付设置」中填写。
// 网关在 AccessKey + ApiSecret + ApiUrl 均非空时启用（与 Stripe / Creem 一致，无独立 Enabled 开关）。
var (
	UsadApiUrl     string // 上游网关地址，例如 https://kai.com/ex-open-api
	UsadAccessKey  string // 公开访问标识
	UsadApiSecret  string // HMAC 签名密钥
	UsadUnitPrice  float64 = 1.0 // 1 单位额度对应的 USAD 数量（用于把 verify 返回的 amount 换算为 quota）
	UsadMinTopUp   int     = 1
)
