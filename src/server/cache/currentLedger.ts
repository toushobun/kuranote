// 已迁移到 server/ledger/adapter/next/revalidateLedger.ts；这里保留
// re-export，让账本切换 / 创建 Server Action（server/actions/currentLedger.ts、
// server/actions/ledgerCreate.ts）无需改动 import 路径，同时保证它们与
// Hono Controller 调用同一个模块级 revalidate 函数，不各自维护一份
// path 清单。#472 迁移账本其余功能时会清理这层兼容导出。
export {
  currentLedgerRevalidatePaths,
  revalidateLedgerMutation as revalidateCurrentLedgerPaths,
} from "server/ledger/adapter/next/revalidateLedger";
