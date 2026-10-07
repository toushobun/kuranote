"use server";

import { redirect } from "next/navigation";

import { ledgerSettingsHref, routePaths } from "config/paths";
import { getCurrentLedgerContext } from "internal/ledger/adapter/next/currentLedger";
import { isValidLedgerInviteToken } from "lib/ledger/inviteToken";
import { createRequestContainer } from "internal/container";
import { revalidateLedgerMutation } from "internal/ledger/adapter/next/revalidateLedger";
import {
  ledgerInviteErrorCodes,
  ledgerInviteErrorMessages,
} from "internal/ledger/errors/ledgerInvite";
import {
  ledgerPlaceholderMemberErrorCodes,
  ledgerPlaceholderMemberErrorMessages,
} from "internal/ledger/errors/ledgerPlaceholderMember";
import { createErrorState } from "internal/shared/adapter/next/actionState";
import { createServerRequestDependencies } from "internal/shared/context/createServerRequestDependencies";
import { AppError } from "internal/shared/errors/appError";
import {
  parseInviteMemberForm,
  parseRegenerateLedgerInviteForm,
} from "internal/ledger/schema/ledgerInviteForm";
import {
  type CreatedLedgerInvite,
  type LedgerInviteActionOperation,
  type LedgerInviteActionState,
} from "types/ledgers";

/** 邀请写入成功后的收尾：跳转页面，或把结果写入状态由页面就地反馈。 */
type InviteActionCompletion = {
  created: (
    ledgerId: string,
    invite: CreatedLedgerInvite & { inviteId: string },
    operation: LedgerInviteActionOperation,
  ) => LedgerInviteActionState;
  revoked: (ledgerId: string) => LedgerInviteActionState;
};

/** 账本设置页：成功后跳回设置页，由 query / fragment 传递页面反馈。 */
const redirectToSettingsCompletion: InviteActionCompletion = {
  created(ledgerId, { inviteId, placeholderId, role, token }) {
    // fragment 仅用于页面反馈（在哪一行展示新链接）；绑定事实以数据库与列表为准。
    const fragment = new URLSearchParams({
      inviteId,
      inviteRole: role,
      inviteToken: token,
      placeholderId,
    });
    redirect(
      `/ledgers/${encodeURIComponent(ledgerId)}/settings#${fragment.toString()}`,
    );
  },
  revoked(ledgerId) {
    redirect(
      `/ledgers/${encodeURIComponent(ledgerId)}/settings?inviteResult=revoked`,
    );
  },
};

/** 创建账本向导：不跳转页面（向导是弹框），把结果写入状态，由邀请入口就地反馈。 */
const inPlaceCompletion: InviteActionCompletion = {
  created(_ledgerId, { placeholderId, role, token }, operation) {
    return {
      createdInvite: { placeholderId, role, token },
      operation,
      successKey: crypto.randomUUID(),
    };
  },
  revoked() {
    return { operation: "revoke", successKey: crypto.randomUUID() };
  },
};

/**
 * 邀请相关的 Server Action（账本设置页），按表单字段 intent 区分：
 * - invite：邀请成员（名字 + 角色），先创建待邀请成员，再生成专属链接；
 * - create：为已有待邀请成员重新生成链接，必须带 placeholderId；
 * - revoke：撤销链接。
 * 成功后跳回账本设置页。
 */
export async function createLedgerInvite(
  _previousState: LedgerInviteActionState,
  formData: FormData,
): Promise<LedgerInviteActionState> {
  return runLedgerInviteAction(formData, redirectToSettingsCompletion);
}

/**
 * 创建账本向导第 6 步使用的邀请 Action。校验、权限与写入与 createLedgerInvite 完全相同，
 * 只是成功后不跳转页面，而是返回 createdInvite / successKey，由邀请入口就地显示链接或撤销结果。
 */
export async function createLedgerSetupInvite(
  _previousState: LedgerInviteActionState,
  formData: FormData,
): Promise<LedgerInviteActionState> {
  return runLedgerInviteAction(formData, inPlaceCompletion);
}

async function runLedgerInviteAction(
  formData: FormData,
  completion: InviteActionCompletion,
): Promise<LedgerInviteActionState> {
  const intent = String(formData.get("intent") ?? "create").trim();
  const operation: LedgerInviteActionOperation =
    intent === "revoke" ? "revoke" : intent === "invite" ? "invite" : "create";
  const { userId } = await getCurrentLedgerContext();
  const ledgerId = String(formData.get("ledgerId") ?? "").trim();

  if (!ledgerId) {
    return errorState(fallbackCodes[operation], operation);
  }

  if (operation === "revoke") {
    const inviteId = String(formData.get("inviteId") ?? "").trim();

    if (!inviteId) {
      return errorState(ledgerInviteErrorCodes.revokeFailed, operation);
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
    return completion.revoked(ledgerId);
  }

  if (operation === "invite") {
    const form = parseInviteMemberForm(formData);
    if (!form.ok) {
      return errorState(form.error, operation);
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

    return finishCreatedInvite(ledgerId, result, operation, true, completion);
  }

  if (intent !== "create") {
    return errorState(ledgerInviteErrorCodes.createFailed, operation);
  }

  const form = parseRegenerateLedgerInviteForm(formData);
  if (!form.ok) {
    return errorState(form.error, operation);
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

  return finishCreatedInvite(ledgerId, result, operation, false, completion);
}

const fallbackCodes = {
  create: ledgerInviteErrorCodes.createFailed,
  invite: ledgerInviteErrorCodes.createFailed,
  revoke: ledgerInviteErrorCodes.revokeFailed,
} as const satisfies Record<LedgerInviteActionOperation, string>;

/**
 * 邀请 Action 可能返回的错误码与文案。名字校验错误的权威文案在待邀请成员
 * 错误定义中，这里只按码引用，不复制文案。
 */
const inviteActionErrorMessages = {
  ...ledgerInviteErrorMessages,
  [ledgerPlaceholderMemberErrorCodes.placeholderNameInvalid]:
    ledgerPlaceholderMemberErrorMessages[
      ledgerPlaceholderMemberErrorCodes.placeholderNameInvalid
    ],
  [ledgerPlaceholderMemberErrorCodes.placeholderNameTooLong]:
    ledgerPlaceholderMemberErrorMessages[
      ledgerPlaceholderMemberErrorCodes.placeholderNameTooLong
    ],
};

type InviteActionErrorCode = keyof typeof inviteActionErrorMessages;

/** 邀请成员会新增待邀请成员，账户持有人与导入候选一并失效。 */
function revalidatePlaceholderMutation(ledgerId: string) {
  revalidateLedgerMutation([
    ledgerSettingsHref(ledgerId),
    routePaths.settingsDataImport,
  ]);
}

function errorState(
  code: InviteActionErrorCode,
  operation: LedgerInviteActionOperation,
): LedgerInviteActionState {
  return {
    ...createErrorState(inviteActionErrorMessages[code]),
    operation,
  };
}

function createActionErrorState(
  error: unknown,
  operation: LedgerInviteActionOperation,
): LedgerInviteActionState {
  if (error instanceof AppError) {
    return { ...createErrorState(error.message), operation };
  }

  console.error("[ledger] ledger invite action failed unexpectedly", {
    errorName: error instanceof Error ? error.name : "unknown",
    operation,
  });
  return errorState(fallbackCodes[operation], operation);
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
  completion: InviteActionCompletion,
): LedgerInviteActionState {
  if (createdPlaceholder) {
    revalidatePlaceholderMutation(ledgerId);
  } else {
    revalidateLedgerMutation([ledgerSettingsHref(ledgerId)]);
  }

  if (!isValidLedgerInviteToken(result.token)) {
    return errorState(ledgerInviteErrorCodes.createFailed, operation);
  }

  return completion.created(ledgerId, result, operation);
}
