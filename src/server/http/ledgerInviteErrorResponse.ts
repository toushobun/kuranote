import {
  getLedgerInviteErrorMessage,
  ledgerInviteErrorCodes,
  type LedgerInviteErrorCode,
} from "server/errors/ledgerInvite";
import { errorResponse } from "server/http/errorResponse";

const statusByCode: Record<LedgerInviteErrorCode, number> = {
  [ledgerInviteErrorCodes.acceptFailed]: 500,
  [ledgerInviteErrorCodes.authRequired]: 401,
  [ledgerInviteErrorCodes.createFailed]: 500,
  [ledgerInviteErrorCodes.inviteAlreadyRevoked]: 409,
  [ledgerInviteErrorCodes.inviteInvalid]: 404,
  [ledgerInviteErrorCodes.inviteRoleInvalid]: 422,
  [ledgerInviteErrorCodes.inviteUsed]: 409,
  [ledgerInviteErrorCodes.loadFailed]: 500,
  [ledgerInviteErrorCodes.permissionDenied]: 403,
  [ledgerInviteErrorCodes.revokeFailed]: 500,
};

export function ledgerInviteErrorResponse(code: LedgerInviteErrorCode) {
  const status = statusByCode[code];
  const message = getLedgerInviteErrorMessage(code) ?? "邀请处理失败，请稍后重试。";
  return errorResponse(code, message, status);
}
