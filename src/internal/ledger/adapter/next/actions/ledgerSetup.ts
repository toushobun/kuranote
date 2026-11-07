"use server";

import { createRequestContainer } from "internal/container";
import { getCurrentLedgerContext } from "internal/ledger/adapter/next/currentLedger";
import { loadLedgerSetupWizard } from "internal/ledger/adapter/next/loadLedgerSetupWizard";
import { revalidateLedgerMutation } from "internal/ledger/adapter/next/revalidateLedger";
import { ledgerAccessErrorMessages } from "internal/ledger/errors/ledgerAccess";
import {
  ledgerSetupErrorCodes,
  ledgerSetupErrorMessages,
  ledgerSetupLoadErrorMessages,
  LedgerSetupTemplateOutdatedError,
  ledgerSetupWriteErrorMessages,
} from "internal/ledger/errors/ledgerSetup";
import { persistLedgerSetupSchema } from "internal/ledger/schema/ledgerSetupDraft";
import { createErrorState } from "internal/shared/adapter/next/actionState";
import { createServerRequestDependencies } from "internal/shared/context/createServerRequestDependencies";
import { AppError, NotFoundError } from "internal/shared/errors/appError";
import type { ActionState } from "types/actions";
import type {
  LedgerSetupPersistActionState,
  PersistLedgerSetupInput,
  LedgerSetupInviteMembersActionState,
  LedgerSetupWizardViewActionState,
  LoadLedgerSetupInviteMembersInput,
} from "types/ledgers";
import { isUuid } from "utils/formData";

function createActionErrorState(
  error: unknown,
  fallbackMessage: string,
  logMessage: string,
) {
  if (error instanceof AppError) {
    return createErrorState(error.message);
  }

  console.error(logMessage, {
    errorName: error instanceof Error ? error.name : "unknown",
  });
  return createErrorState(fallbackMessage);
}

function createNotFoundError() {
  return new NotFoundError(
    ledgerSetupErrorCodes.notFound,
    ledgerSetupErrorMessages[ledgerSetupErrorCodes.notFound],
  );
}

/** Server Action 的参数来自客户端，账本 ID 在服务端重新校验。 */
function parseLedgerId(input: unknown): string | null {
  if (typeof input !== "object" || input === null) return null;

  const { ledgerId } = input as { ledgerId?: unknown };
  return typeof ledgerId === "string" && isUuid(ledgerId) ? ledgerId : null;
}

/**
 * 向导唯一写入点：退出时保存、最终完成都在一个数据库事务提交。
 * 所有来自客户端的字段由 Action/Service/RPC 分别校验，不能信任前端快照。
 */
export async function persistLedgerSetup(
  input: PersistLedgerSetupInput,
): Promise<LedgerSetupPersistActionState> {
  await getCurrentLedgerContext();

  const parsed = persistLedgerSetupSchema.safeParse(input);
  if (!parsed.success) {
    return createErrorState(
      ledgerSetupErrorMessages[ledgerSetupErrorCodes.draftInvalid],
    );
  }

  const { setup, expectedUpdatedAt, step, complete } = parsed.data;
  try {
    const dependencies = await createServerRequestDependencies();
    const service = createRequestContainer(dependencies).ledger.setupService;
    // Service 验证草稿及预设，数据库校验基本信息/权限/锁版本。
    const updatedAt = await service.persist({
      ledgerId: setup.id,
      expectedUpdatedAt,
      name: setup.name,
      baseCurrency: setup.baseCurrency,
      displayName: setup.displayName,
      displayColor: setup.displayColor,
      livingRegion: setup.livingRegion,
      step,
      draft: setup.draft,
      complete,
    });
    revalidateLedgerMutation();
    return { updatedAt, completed: complete };
  } catch (error) {
    if (error instanceof LedgerSetupTemplateOutdatedError) {
      return {
        ...createErrorState(error.message),
        refreshedTemplate: { draft: error.draft, template: error.template },
      };
    }
    return createActionErrorState(
      error,
      complete
        ? ledgerSetupWriteErrorMessages.completeFailed
        : ledgerSetupWriteErrorMessages.draftSaveFailed,
      "[ledger] ledger setup commit action failed unexpectedly",
    );
  }
}

/**
 * 向导第 6 步「邀请成员」：读取新账本（已完成）的待邀请成员与待接受邀请。
 * 与账本设置页使用同一组 Service 调用，权限（管理者才能读取邀请）由 Service 校验。
 * 向导是客户端弹框，邀请 / 改名 / 删除后由步骤再次调用以刷新列表。
 */
export async function loadLedgerSetupInviteMembers(
  input: LoadLedgerSetupInviteMembersInput,
): Promise<LedgerSetupInviteMembersActionState> {
  const { userId } = await getCurrentLedgerContext();
  const ledgerId = parseLedgerId(input);

  if (!ledgerId) {
    return createErrorState(ledgerAccessErrorMessages.ledgerInaccessible);
  }

  try {
    const dependencies = await createServerRequestDependencies();
    const container = createRequestContainer(dependencies);
    const [pendingInvites, placeholderMembers] = await Promise.all([
      container.ledger.inviteService.listPending({ ledgerId, userId }),
      container.ledger.placeholderMemberService.listUnclaimed({
        ledgerId,
        userId,
      }),
    ]);

    return { members: { pendingInvites, placeholderMembers } };
  } catch (error) {
    return createActionErrorState(
      error,
      ledgerSetupLoadErrorMessages.inviteMembersLoadFailed,
      "[ledger] ledger setup invite members action failed unexpectedly",
    );
  }
}

/**
 * 首页 / 账本管理页打开向导时读取向导数据（第 1 步默认值、创建中账本进度、默认大分类）。
 * 只在打开时读取，避免入口页每次渲染都读取完整的向导数据。
 */
export async function loadLedgerSetupWizardView(): Promise<LedgerSetupWizardViewActionState> {
  // 未登录时的登录跳转在 try 外触发，保持原控制流。
  await getCurrentLedgerContext();

  try {
    return { view: await loadLedgerSetupWizard() };
  } catch (error) {
    return createActionErrorState(
      error,
      ledgerSetupLoadErrorMessages.loadFailed,
      "[ledger] ledger setup wizard load action failed unexpectedly",
    );
  }
}

/** 放弃创建仅由页面交互调用，不新增 HTTP 路由。 */
export async function abandonLedgerSetup(input: unknown): Promise<ActionState> {
  try {
    const ledgerId = parseLedgerId(input);
    if (!ledgerId) throw createNotFoundError();
    const dependencies = await createServerRequestDependencies();
    await createRequestContainer(dependencies).ledger.setupService.abandon(
      ledgerId,
    );
    revalidateLedgerMutation();
    return {};
  } catch (error) {
    return createActionErrorState(
      error,
      ledgerSetupWriteErrorMessages.abandonFailed,
      "[ledger] ledger setup abandon action failed unexpectedly",
    );
  }
}
