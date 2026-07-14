import type { QueryData } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

import { routePaths } from "config/paths";
import {
  getCurrentLedgerContext,
  type CurrentLedgerRole,
} from "lib/ledger/current-ledger";
import { createClient } from "lib/supabase/server";
import { loadPendingLedgerInvitesService } from "server/services/ledgerInvite";
import {
  getStableFallbackThemeColorKey,
  isThemeColorKey,
  type ThemeColorKey,
} from "theme/themeColorTokens";
import type { LedgerSettingsView } from "types/ledgers";

const fallbackRole: CurrentLedgerRole = "member";

function normalizeRole(role: string | null): CurrentLedgerRole {
  if (
    role === "owner" ||
    role === "admin" ||
    role === "member" ||
    role === "viewer"
  ) {
    return role;
  }

  return fallbackRole;
}

function normalizeDisplayColor(
  color: string | null | undefined,
  fallbackSeed: string,
): ThemeColorKey {
  return color && isThemeColorKey(color)
    ? color
    : getStableFallbackThemeColorKey(fallbackSeed);
}

function normalizeDisplayName(
  scopedDisplayName: string | null | undefined,
  globalDisplayName: string | null | undefined,
) {
  const trimmedScopedName = scopedDisplayName?.trim();

  if (trimmedScopedName) {
    return trimmedScopedName;
  }

  return globalDisplayName ?? "未命名用户";
}

export async function loadLedgerSettingsView(
  ledgerId: string,
): Promise<LedgerSettingsView> {
  const { currentLedger, ledgers, userId } = await getCurrentLedgerContext();

  if (!currentLedger) {
    redirect(routePaths.dashboard);
  }

  const ledger = ledgers.find((item) => item.id === ledgerId);

  if (!ledger) {
    redirect(routePaths.ledgers);
  }

  const supabase = await createClient();
  const memberQuery = supabase
    .from("ledger_member")
    .select("user_id, role")
    .eq("ledger_id", ledgerId)
    .eq("status", "active")
    .order("joined_at", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true })
    .order("user_id", { ascending: true });
  type MemberRows = QueryData<typeof memberQuery>;

  const [memberResult, pendingInviteResult] = await Promise.all([
    memberQuery,
    loadPendingLedgerInvitesService(ledgerId),
  ]);

  if (memberResult.error) {
    console.error("Failed to load ledger setting members.", memberResult.error);
    throw new Error(
      `Failed to load ledger setting members: ${memberResult.error.message}`,
    );
  }

  if (!pendingInviteResult.ok) {
    console.error(
      "Failed to load pending ledger invites.",
      pendingInviteResult.error,
    );
    throw new Error(
      `Failed to load pending ledger invites: ${pendingInviteResult.error}`,
    );
  }

  const memberRows: MemberRows = memberResult.data ?? [];
  const userIds = memberRows
    .map((member) => member.user_id)
    .filter((memberUserId): memberUserId is string =>
      Boolean(memberUserId && memberUserId.length > 0),
    );

  if (!userIds.includes(userId)) {
    redirect(routePaths.ledgers);
  }

  const [profilesResult, displaySettingsResult] = await Promise.all([
    supabase
      .from("app_user")
      .select("id, display_name, email, avatar_url")
      .in("id", userIds),
    supabase
      .from("ledger_member_display_setting")
      .select("user_id, display_name, display_color")
      .eq("ledger_id", ledgerId),
  ]);

  if (profilesResult.error) {
    console.error(
      "Failed to load ledger setting profiles.",
      profilesResult.error,
    );
    throw new Error(
      `Failed to load ledger setting profiles: ${profilesResult.error.message}`,
    );
  }

  if (displaySettingsResult.error) {
    console.error(
      "Failed to load ledger member display settings.",
      displaySettingsResult.error,
    );
    throw new Error(
      `Failed to load ledger member display settings: ${displaySettingsResult.error.message}`,
    );
  }

  const profileByUserId = new Map(
    (profilesResult.data ?? []).map((profile) => [profile.id, profile]),
  );
  const displaySettingByUserId = new Map(
    (displaySettingsResult.data ?? []).map((setting) => [
      setting.user_id,
      setting,
    ]),
  );

  const members = memberRows.map((member) => {
    const memberUserId = member.user_id ?? "";
    const profile = profileByUserId.get(memberUserId);
    const displaySetting = displaySettingByUserId.get(memberUserId);

    return {
      avatarUrl: profile?.avatar_url ?? null,
      displayColor: normalizeDisplayColor(
        displaySetting?.display_color,
        memberUserId,
      ),
      displayName: normalizeDisplayName(
        displaySetting?.display_name,
        profile?.display_name,
      ),
      email: profile?.email ?? null,
      role: normalizeRole(typeof member.role === "string" ? member.role : null),
      userId: memberUserId,
    };
  });

  const currentUserMember = members.find((member) => member.userId === userId);

  if (!currentUserMember) {
    redirect(routePaths.ledgers);
  }

  const canEditLedger =
    currentUserMember.role === "owner" || currentUserMember.role === "admin";

  return {
    canEditLedger,
    currentUser: {
      displayColor: currentUserMember.displayColor,
      displayName: currentUserMember.displayName,
      userId,
    },
    ledger: {
      baseCurrency: ledger.baseCurrency,
      currentUserRole: ledger.currentUserRole,
      id: ledger.id,
      isCurrent: currentLedger.id === ledger.id,
      name: ledger.name,
    },
    members,
    pendingInvites: pendingInviteResult.invites,
  };
}
