import { NextResponse } from "next/server";

import { isValidLedgerInviteToken } from "lib/ledger/inviteToken";
import { revalidateCurrentLedgerPaths } from "server/cache/currentLedger";
import { ledgerInviteErrorCodes } from "server/errors/ledgerInvite";
import { errorResponse } from "server/http/errorResponse";
import { ledgerInviteErrorResponse } from "server/http/ledgerInviteErrorResponse";
import { isSameOriginRequest } from "server/http/sameOriginRequest";
import { acceptLedgerInviteService } from "server/services/ledgerInvite";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return errorResponse("forbidden", "请求来源无效。", 403);
  }

  let token: unknown;

  try {
    const body = (await request.json()) as { token?: unknown };
    token = body.token;
  } catch {
    return errorResponse("invalid_request", "请求内容无效。", 400);
  }

  if (typeof token !== "string" || !isValidLedgerInviteToken(token)) {
    return errorResponse("invalid_request", "请求内容无效。", 400);
  }

  try {
    const result = await acceptLedgerInviteService(token);

    if (!result.ok) {
      return ledgerInviteErrorResponse(result.error);
    }

    revalidateCurrentLedgerPaths();
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error("[ledgerInvite] failed to accept invite route", error);
    return ledgerInviteErrorResponse(ledgerInviteErrorCodes.acceptFailed);
  }
}
