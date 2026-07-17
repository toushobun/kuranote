import { NextResponse } from "next/server";

import { isValidLedgerInviteToken } from "lib/ledger/inviteToken";
import { revalidateCurrentLedgerPaths } from "server/cache/currentLedger";
import { ledgerInviteErrorCodes } from "server/errors/ledgerInvite";
import { ledgerInviteErrorResponse } from "server/http/ledgerInviteErrorResponse";
import { acceptLedgerInviteService } from "server/services/ledgerInvite";

export async function POST(request: Request) {
  let token: unknown;

  try {
    const body = (await request.json()) as { token?: unknown };
    token = body.token;
  } catch {
    return ledgerInviteErrorResponse(ledgerInviteErrorCodes.inviteInvalid);
  }

  if (typeof token !== "string" || !isValidLedgerInviteToken(token)) {
    return ledgerInviteErrorResponse(ledgerInviteErrorCodes.inviteInvalid);
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
