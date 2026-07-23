import type { InternalModule } from "internal/internalModule";
import { ledgerInviteRouter } from "internal/ledger/inviteRouter";
import { ledgerRouter } from "internal/ledger/router";

export {
  currentLedgerErrorCodes,
  type CurrentLedgerErrorCode,
  type CurrentLedgerValidationErrorCode,
} from "internal/ledger/errors/currentLedger";
export {
  ledgerSettingsErrorCodes,
  type LedgerSettingsErrorCode,
} from "internal/ledger/errors/ledgerSettings";

/** 保留既有邀请接受 URL，避免破坏已经发布的邀请链接。 */
export const ledgerInviteModule = {
  basePath: "/ledger-invites",
  name: "ledger-invites",
  router: ledgerInviteRouter,
} satisfies InternalModule;

/** Ledger 创建、切换、设置和邀请管理的统一业务入口。 */
export const ledgerModule = {
  basePath: "/ledgers",
  name: "ledger",
  router: ledgerRouter,
} satisfies InternalModule;
