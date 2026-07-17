// @vitest-environment node

import { describe, expect, it, vi } from "vitest";

import { createSupabaseLedgerInviteRepository } from "server/ledger/repository/ledgerInviteRepository";
import type { AuthenticatedSupabaseClient } from "server/shared/supabase/authenticatedClient";

function createSupabaseStub(
  rpcResult: { data: null; error: null } | { data: null; error: unknown },
) {
  return {
    rpc: vi.fn().mockResolvedValue(rpcResult),
  } as unknown as AuthenticatedSupabaseClient;
}

describe("createSupabaseLedgerInviteRepository", () => {
  it("RPC 成功时返回 ok: true", async () => {
    const supabase = createSupabaseStub({ data: null, error: null });
    const repository = createSupabaseLedgerInviteRepository(supabase);

    const result = await repository.accept("token-1");

    expect(result).toEqual({ ok: true });
    expect(supabase.rpc).toHaveBeenCalledWith("accept_ledger_invite", {
      p_token: "token-1",
    });
  });

  it("RPC 返回业务错误时映射为对应的错误码", async () => {
    const supabase = createSupabaseStub({
      data: null,
      error: { details: "invite_invalid", message: "invalid" },
    });
    const repository = createSupabaseLedgerInviteRepository(supabase);

    const result = await repository.accept("token-1");

    expect(result).toEqual({ code: "invite_invalid", ok: false });
  });

  it("RPC 返回未知错误时回退为 accept_failed", async () => {
    const supabase = createSupabaseStub({
      data: null,
      error: { message: "unexpected" },
    });
    const repository = createSupabaseLedgerInviteRepository(supabase);

    const result = await repository.accept("token-1");

    expect(result).toEqual({ code: "accept_failed", ok: false });
  });
});
