import {
  getInviteMemberLinkFailedMessage,
  getLedgerInviteErrorMessage,
  ledgerInviteErrorCodes,
  type LedgerInviteErrorCode,
} from "internal/ledger/errors/ledgerInvite";
import { ledgerPlaceholderMemberErrorCodes } from "internal/ledger/errors/ledgerPlaceholderMember";
import type {
  AcceptedLedgerInvite,
  LedgerInviteRepository,
  PendingLedgerInvite,
} from "internal/ledger/repository/ledgerInviteRepository";
import {
  requireActiveLedgerMemberRole,
  type LedgerAccessService,
} from "internal/ledger/service/ledgerAccessService";
import type { LedgerPlaceholderMemberService } from "internal/ledger/service/ledgerPlaceholderMemberService";
import {
  AppError,
  AuthenticationError,
  AuthorizationError,
  ConflictError,
  NotFoundError,
  RepositoryError,
  ValidationError,
} from "internal/shared/errors/appError";
import type { LedgerInviteRole } from "internal/ledger/entity/ledgerInviteRole";
import type { Logger } from "internal/shared/logging/logger";

export type LedgerInviteServiceDependencies = {
  ledgerAccessService: LedgerAccessService;
  ledgerInviteRepository: LedgerInviteRepository;
  /** 「邀请成员」编排只需要创建待邀请成员。 */
  ledgerPlaceholderMemberService: Pick<
    LedgerPlaceholderMemberService,
    "create"
  >;
  logger?: Logger;
};

export type CreatedLedgerInvite = {
  inviteId: string;
  placeholderId: string;
  role: LedgerInviteRole;
  token: string;
};

export type ManageLedgerInviteInput = {
  ledgerId: string;
  userId: string;
};

export type CreateLedgerInviteInput = ManageLedgerInviteInput & {
  /** 邀请必须绑定一名待邀请成员（#809 起不再支持匿名邀请）。 */
  placeholderId: string;
  role: LedgerInviteRole;
};

export type InviteMemberInput = ManageLedgerInviteInput & {
  displayName: string;
  role: LedgerInviteRole;
};

export type RevokeLedgerInviteInput = ManageLedgerInviteInput & {
  inviteId: string;
};

export type LedgerInviteService = {
  accept(token: string): Promise<AcceptedLedgerInvite>;
  create(input: CreateLedgerInviteInput): Promise<CreatedLedgerInvite>;
  /** 邀请成员 = 创建待邀请成员 + 生成绑定该成员的专属链接。 */
  inviteMember(input: InviteMemberInput): Promise<CreatedLedgerInvite>;
  revoke(input: RevokeLedgerInviteInput): Promise<void>;
  listPending(input: ManageLedgerInviteInput): Promise<PendingLedgerInvite[]>;
};

function toAppError(code: LedgerInviteErrorCode): AppError {
  const message =
    getLedgerInviteErrorMessage(code) ?? "邀请操作失败，请稍后重试。";

  switch (code) {
    case ledgerInviteErrorCodes.authRequired:
      return new AuthenticationError(code, message);
    case ledgerInviteErrorCodes.permissionDenied:
    case ledgerInviteErrorCodes.userInactive:
      return new AuthorizationError(code, message);
    case ledgerInviteErrorCodes.inviteInvalid:
    case ledgerInviteErrorCodes.ledgerNotFound:
    case ledgerInviteErrorCodes.placeholderNotFound:
      return new NotFoundError(code, message);
    case ledgerInviteErrorCodes.inviteUsed:
    case ledgerInviteErrorCodes.inviteAlreadyRevoked:
    case ledgerInviteErrorCodes.inviteMemberLinkFailed:
    case ledgerInviteErrorCodes.inviteMemberNameConflict:
    case ledgerInviteErrorCodes.placeholderAlreadyClaimed:
    case ledgerInviteErrorCodes.placeholderClaimAccountNameConflict:
    case ledgerInviteErrorCodes.placeholderClaimExistingMember:
    case ledgerInviteErrorCodes.placeholderInvitePending:
      return new ConflictError(code, message);
    case ledgerInviteErrorCodes.inviteRoleInvalid:
    case ledgerInviteErrorCodes.placeholderRequired:
      return new ValidationError(code, message);
    default:
      return new RepositoryError(code, message);
  }
}

async function requireInviteManager(
  ledgerAccessService: LedgerAccessService,
  { ledgerId, userId }: ManageLedgerInviteInput,
): Promise<void> {
  const role = await requireActiveLedgerMemberRole(ledgerAccessService, {
    ledgerId,
    userId,
  });

  if (role !== "owner" && role !== "admin") {
    throw toAppError(ledgerInviteErrorCodes.permissionDenied);
  }
}

/**
 * Ledger 邀请相关的 UseCase。创建、撤销和列表读取都在 Service 内独立
 * 校验 owner/admin 权限，不依赖 Router middleware 或 RPC 的隐式检查。
 */
export function createLedgerInviteService({
  ledgerAccessService,
  ledgerInviteRepository,
  ledgerPlaceholderMemberService,
  logger,
}: LedgerInviteServiceDependencies): LedgerInviteService {
  // 调用方已完成管理权限预检；占位归属、认领状态与有效绑定由 RPC 持锁后判断。
  async function createBoundInvite(
    ledgerId: string,
    role: LedgerInviteRole,
    placeholderId: string,
  ): Promise<CreatedLedgerInvite> {
    // 数据库返回小写 UUID，这里统一为小写，避免 Repository 的一致性校验误判。
    const result = await ledgerInviteRepository.create(
      ledgerId,
      role,
      placeholderId.toLowerCase(),
    );

    if (!result.ok) {
      throw toAppError(result.code);
    }

    return {
      inviteId: result.inviteId,
      placeholderId: result.placeholderId,
      role: result.role,
      token: result.token,
    };
  }

  return {
    async accept(token) {
      // 接受者不要求预先属于账本；成员冲突、占位状态等最终判断由 RPC 持锁完成。
      const result = await ledgerInviteRepository.accept(token);

      if (!result.ok) {
        throw toAppError(result.code);
      }

      return result.invite;
    },

    async create(input) {
      await requireInviteManager(ledgerAccessService, input);
      return createBoundInvite(input.ledgerId, input.role, input.placeholderId);
    },

    async inviteMember(input) {
      await requireInviteManager(ledgerAccessService, input);

      // 第 1 步：创建待邀请成员。重名时不自动复用同名占位，引导用户在列表中操作。
      let placeholderId: string;
      try {
        ({ placeholderId } = await ledgerPlaceholderMemberService.create({
          displayName: input.displayName,
          ledgerId: input.ledgerId,
          userId: input.userId,
        }));
      } catch (error) {
        if (
          error instanceof ConflictError &&
          error.code ===
            ledgerPlaceholderMemberErrorCodes.placeholderNameConflict
        ) {
          throw toAppError(ledgerInviteErrorCodes.inviteMemberNameConflict);
        }
        throw error;
      }

      // 第 2 步：生成绑定邀请。两步是独立事务，失败时占位已保留，
      // 返回部分成功文案，由列表中的「生成链接」重试，不重复创建占位。
      try {
        return await createBoundInvite(
          input.ledgerId,
          input.role,
          placeholderId,
        );
      } catch (error) {
        logger?.warn("[ledger] invite member link creation failed", {
          errorCode: error instanceof AppError ? error.code : null,
          errorName: error instanceof Error ? error.name : null,
        });
        throw new ConflictError(
          ledgerInviteErrorCodes.inviteMemberLinkFailed,
          getInviteMemberLinkFailedMessage(input.displayName.trim()),
        );
      }
    },

    async listPending(input) {
      await requireInviteManager(ledgerAccessService, input);
      const result = await ledgerInviteRepository.listPending(input.ledgerId);

      if (!result.ok) {
        throw toAppError(result.code);
      }

      return result.invites;
    },

    async revoke(input) {
      await requireInviteManager(ledgerAccessService, input);
      const result = await ledgerInviteRepository.revoke(
        input.ledgerId,
        input.inviteId,
      );

      if (!result.ok) {
        throw toAppError(result.code);
      }
    },
  };
}
