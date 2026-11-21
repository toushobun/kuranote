/** #1139 汇率同步仅供服务端 Cron 使用；统计读取通过数据库函数取值。 */
export { executeExchangeRateRefresh } from "./service/exchangeRateRefreshService";
