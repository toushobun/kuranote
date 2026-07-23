import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const inviteMigrationSql = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/20260713011000_add_ledger_invites.sql",
  ),
  "utf8",
);

const createTableBlock =
  inviteMigrationSql.match(
    /create table public\.ledger_invite \(([\s\S]*?)\n\);/,
  )?.[1] ?? "";

describe("账本邀请 migration", () => {
  it("邀请表只持久化 token 摘要，且禁止客户端直接读写", () => {
    expect(createTableBlock).toContain("token_hash text not null unique");
    expect(createTableBlock).not.toContain("token text");
    expect(inviteMigrationSql).toContain(
      "alter table public.ledger_invite enable row level security;",
    );
    expect(inviteMigrationSql).toContain(
      "revoke all on table public.ledger_invite from anon;",
    );
    expect(inviteMigrationSql).toContain(
      "revoke all on table public.ledger_invite from authenticated;",
    );
  });

  it("create_ledger_invite 只存储原始 token 的 sha256 摘要", () => {
    expect(inviteMigrationSql).toContain(
      "v_token := encode(gen_random_bytes(32), 'hex');",
    );
    expect(inviteMigrationSql).toContain(
      "encode(digest(v_token, 'sha256'), 'hex'),",
    );
  });

  it("create_ledger_invite 要求管理权限且账本必须存在且有效", () => {
    expect(inviteMigrationSql).toContain(
      "if not public.current_user_can_manage_ledger(p_ledger_id) then",
    );
    expect(inviteMigrationSql).toContain(
      "errcode = '42501', detail = 'permission_denied'",
    );
    expect(inviteMigrationSql).toContain(
      "errcode = 'P0002', detail = 'ledger_not_found'",
    );
  });

  it("被移除成员通过新邀请重新加入时不再被成员管理 trigger 拦截", () => {
    expect(inviteMigrationSql).toContain(
      "current_setting('app.allow_ledger_invite_accept', true) = 'true'",
    );
    expect(inviteMigrationSql).toContain("new.role in ('member', 'viewer')");
    expect(inviteMigrationSql).toContain("new.invited_by is not null");
  });

  it("重新激活既存成员时保留原 created_by / created_at / invited_by", () => {
    expect(inviteMigrationSql).toContain("new.created_by = old.created_by");
    expect(inviteMigrationSql).toContain("new.created_at = old.created_at");
    expect(inviteMigrationSql).toContain(
      "new.invited_by is not distinct from old.invited_by",
    );
  });

  it("accept_ledger_invite 锁定邀请记录避免并发重复接受", () => {
    expect(inviteMigrationSql).toContain(
      "from public.ledger_invite li\n     where li.token_hash = v_token_hash\n     for update;",
    );
    expect(inviteMigrationSql).toContain(
      "perform set_config('app.allow_ledger_invite_accept', 'true', true);",
    );
    expect(inviteMigrationSql).toContain(
      "perform set_config('app.allow_ledger_invite_accept', 'false', true);",
    );
  });

  it("邀请已撤销或已被使用时返回稳定业务错误码", () => {
    expect(inviteMigrationSql).toContain(
      "v_invite.id is null or v_invite.revoked_at is not null",
    );
    expect(inviteMigrationSql).toContain(
      "errcode = 'P0002', detail = 'invite_invalid'",
    );
    expect(inviteMigrationSql).toContain(
      "errcode = '23505', detail = 'invite_already_used'",
    );
  });

  it("已是 active 成员时直接返回 already_member 并切换当前账本", () => {
    expect(inviteMigrationSql).toContain("v_existing_status = 'active'");
    expect(inviteMigrationSql).toContain("'already_member'::text");
    expect(inviteMigrationSql).toContain(
      "insert into public.user_setting (user_id, current_ledger_id, created_by, updated_by)",
    );
  });

  it("邀请预览优先展示已是成员状态，避免误报已撤销或已失效", () => {
    expect(inviteMigrationSql.indexOf("'already_member'")).toBeLessThan(
      inviteMigrationSql.indexOf("'revoked'"),
    );
    expect(inviteMigrationSql.indexOf("'already_member'")).toBeLessThan(
      inviteMigrationSql.indexOf("'accepted'"),
    );
  });

  it("本期未暴露撤回邀请 RPC，仅保留撤回字段供后续 issue 使用", () => {
    expect(inviteMigrationSql).not.toContain(
      "function public.revoke_ledger_invite",
    );
    expect(createTableBlock).toContain("revoked_at timestamptz");
    expect(createTableBlock).toContain("revoked_by uuid");
  });
});
