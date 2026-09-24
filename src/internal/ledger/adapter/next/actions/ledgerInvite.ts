"use server";

import { redirect } from "next/navigation";

import { ledgerSettingsHref, routePaths } from "config/paths";
import { getCurrentLedgerContext } from "internal/ledger/adapter/next/currentLedger";
import { isValidLedgerInviteToken } from "lib/ledger/inviteToken";
import { createRequestContainer } from "internal/container";
import { revalidateLedgerMutation } from "internal/ledger/adapter/next/revalidateLedger";
import {
  getLedgerInviteErrorMessage,
  ledgerInviteErrorCodes,
} from "internal/ledger/errors/ledgerInvite";
import { getLedgerPlaceholderMemberErrorMessage } from "internal/ledger/errors/ledgerPlaceholderMember";
import { createServerRequestDependencies } from "internal/shared/context/createServerRequestDependencies";
import { AppError } from "internal/shared/errors/appError";
import {
  parseInviteMemberForm,
  parseRegenerateLedgerInviteForm,
} from "internal/ledger/schema/ledgerInviteForm";
import {
  type LedgerInviteActionOperation,
  type LedgerInviteActionState,
} from "types/ledgers";

/**
 * 邀请相关的 Server Action，按表单字段 intent 区分：
 * - invite：邀请成员（名字 + 角色），先创建待邀请成员，再生成专属链接；
 * - create：为已有待邀请成员重新生成链接，必须带 placeholderId；
 * - revoke：撤销链接。
 */
export async function createLedgerInvite(
  _previousState: LedgerInviteActionState,
  formData: FormData,
): Promise<LedgerInviteActionState> {
  const intent = String(formData.get("intent") ?? "create").trim();
  const operation: LedgerInviteActionOperation =
    intent === "revoke" ? "revoke" : intent === "invite" ? "invite" : "create";
  const { userId } = await getCurrentLedgerContext();
  const ledgerId = String(formData.get("ledgerId") ?? "").trim();

  if (!ledgerId) {
    return createErrorState(fallbackCodes[operation], operation);
  }

  if (operation === "revoke") {
    const inviteId = String(formData.get("inviteId") ?? "").trim();

    if (!inviteId) {
      return createErrorState(ledgerInviteErrorCodes.revokeFailed, operation);
    }

    try {
      const dependencies = await createServerRequestDependencies();
      const container = createRequestContainer(dependencies);
      await container.ledger.inviteService.revoke({
        inviteId,
        ledgerId,
        userId,
      });
    } catch (error) {
      return createActionErrorState(error, operation);
    }

    revalidateLedgerMutation([ledgerSettingsHref(ledgerId)]);
    redirect(
      `/ledgers/${encodeURIComponent(ledgerId)}/settings?inviteResult=revoked`,
    );
  }

  if (operation === "invite") {
    const form = parseInviteMemberForm(formData);
    if (!form.ok) {
      return createErrorState(form.error, operation);
    }

    let result;
    try {
      const dependencies = await createServerRequestDependencies();
      const container = createRequestContainer(dependencies);
      result = await container.ledger.inviteService.inviteMember({
        displayName: form.value.displayName,
        ledgerId,
        role: form.value.role,
        userId,
      });
    } catch (error) {
      // 部分成功：待邀请成员已创建，刷新成员列表让这一行出现，便于重新生成链接。
      if (
        error instanceof AppError &&
        error.code === ledgerInviteErrorCodes.inviteMemberLinkFailed
      ) {
        revalidatePlaceholderMutation(ledgerId);
      }
      return createActionErrorState(error, operation);
    }

    return finishCreatedInvite(ledgerId, result, operation, true);
  }

  if (intent !== "create") {
    return createErrorState(ledgerInviteErrorCodes.createFailed, operation);
  }

  const form = parseRegenerateLedgerInviteForm(formData);
  if (!form.ok) {
    return createErrorState(form.error, operation);
  }

  let result;
  try {
    const dependencies = await createServerRequestDependencies();
    const container = createRequestContainer(dependencies);
    result = await container.ledger.inviteService.create({
      ledgerId,
      placeholderId: form.value.placeholderId,
      role: form.value.role,
      userId,
    });
  } catch (error) {
    return createActionErrorState(error, operation);
  }

  return finishCreatedInvite(ledgerId, result, operation, false);
}

const fallbackCodes = {
  create: ledgerInviteErrorCodes.createFailed,
  invite: ledgerInviteErrorCodes.createFailed,
  revoke: ledgerInviteErrorCodes.revokeFailed,
} as const satisfies Record<LedgerInviteActionOperation, string>;

/** 邀请成员会新增待邀请成员，账户持有人与导入候选一并失效。 */
function revalidatePlaceholderMutation(ledgerId: string) {
  revalidateLedgerMutation([
    ledgerSettingsHref(ledgerId),
    routePaths.settingsDataImport,
  ]);
}

function createErrorState(
  code: string,
  operation: LedgerInviteActionOperation,
): LedgerInviteActionState {
  return {
    // 名字校验错误的权威文案在待邀请成员错误定义中，这里只按码查找，不复制文案。
    error:
      getLedgerInviteErrorMessage(code) ??
      getLedgerPlaceholderMemberErrorMessage(code) ??
      getLedgerInviteErrorMessage(fallbackCodes[operation])!,
    errorKey: crypto.randomUUID(),
    operation,
  };
}

function createActionErrorState(
  error: unknown,
  operation: LedgerInviteActionOperation,
): LedgerInviteActionState {
  if (error instanceof AppError) {
    return {
      error: error.message,
      errorKey: crypto.randomUUID(),
      operation,
    };
  }

  console.error("[ledger] ledger invite action failed unexpectedly", {
    errorName: error instanceof Error ? error.name : "unknown",
    operation,
  });
  return createErrorState(fallbackCodes[operation], operation);
}

function finishCreatedInvite(
  ledgerId: string,
  result: {
    inviteId: string;
    placeholderId: string;
    role: string;
    token: string;
  },
  operation: LedgerInviteActionOperation,
  createdPlaceholder: boolean,
): LedgerInviteActionState {
  if (createdPlaceholder) {
    revalidatePlaceholderMutation(ledgerId);
  } else {
    revalidateLedgerMutation([ledgerSettingsHref(ledgerId)]);
  }

  if (!isValidLedgerInviteToken(result.token)) {
    return createErrorState(ledgerInviteErrorCodes.createFailed, operation);
  }

  // fragment 仅用于页面反馈（在哪一行展示新链接）；绑定事实以数据库与列表为准。
  const fragment = new URLSearchParams({
    inviteId: result.inviteId,
    inviteRole: result.role,
    inviteToken: result.token,
    placeholderId: result.placeholderId,
  });
  redirect(
    `/ledgers/${encodeURIComponent(ledgerId)}/settings#${fragment.toString()}`,
  );
}
