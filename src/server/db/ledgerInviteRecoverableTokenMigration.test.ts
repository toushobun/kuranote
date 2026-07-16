import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const migrationSql = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/20260716210000_restore_ledger_invite_token.sql",
  ),
  "utf8",
);

describe("可恢复邀请 token migration", () => {
  it("新增明文 token 字段并约束其长度与生命周期", () => {
    expect(migrationSql).toContain("add column invite_token text;");
    expect(migrationSql).toContain("ledger_invite_token_length_check");
    expect(migrationSql).toContain("length(invite_token) = 64");
    expect(migrationSql).toContain("ledger_invite_token_lifecycle_check");
    expect(migrationSql).toContain(
      "accepted_at is null and revoked_at is null and invite_token is not null",
    );
  });

  it("无法恢复 token 的旧待邀请会先被撤销", () => {
    const revokeLegacyIndex = migrationSql.indexOf(
      "set revoked_at = now(),\n       revoked_by = created_by",
    );
    const lifecycleConstraintIndex = migrationSql.indexOf(
      "ledger_invite_token_lifecycle_check",
    );

    expect(revokeLegacyIndex).toBeGreaterThan(-1);
    expect(lifecycleConstraintIndex).toBeGreaterThan(revokeLegacyIndex);
    expect(migrationSql).toContain("and invite_token is null;");
  });

  it("创建邀请时同时保存摘要与待接受期间的原始 token", () => {
    expect(migrationSql).toContain(
      "encode(extensions.digest(v_token, 'sha256'), 'hex')",
    );
    expect(migrationSql).toContain(
      "token_hash,\n        invite_token,\n        role",
    );
    expect(migrationSql).toContain(
      "encode(extensions.digest(v_token, 'sha256'), 'hex'),\n        v_token,",
    );
  });

  it("待邀请列表仅向管理者返回 token", () => {
    expect(migrationSql).toContain(
      "v_can_manage := public.current_user_can_manage_ledger(p_ledger_id);",
    );
    expect(migrationSql).toContain(
      "case when v_can_manage then li.invite_token else null::text end",
    );
    expect(migrationSql).toContain("lm.status = 'active'");
  });

  it("接受和撤销邀请时立即清除原始 token", () => {
    expect(migrationSql.match(/invite_token = null/g)).toHaveLength(2);
    expect(migrationSql).toContain("set revoked_at = now(),");
    expect(migrationSql).toContain("set accepted_at = now(),");
  });

  it("删除未上线的替换 RPC", () => {
    expect(migrationSql).toContain(
      "drop function if exists public.replace_ledger_invite(uuid, uuid);",
    );
    expect(migrationSql).not.toContain(
      "create function public.replace_ledger_invite",
    );
  });

  it("相关 RPC 不向 anon 暴露", () => {
    for (const signature of [
      "create_ledger_invite_v2(uuid, text)",
      "list_pending_ledger_invites(uuid)",
      "revoke_ledger_invite(uuid, uuid)",
      "accept_ledger_invite(text)",
    ]) {
      expect(migrationSql).toContain(
        `revoke all on function public.${signature} from anon;`,
      );
      expect(migrationSql).toContain(
        `grant execute on function public.${signature} to authenticated;`,
      );
    }
  });
});
