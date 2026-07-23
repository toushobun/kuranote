import type { CurrentLedger } from "lib/ledger/current-ledger";
import {
  ledgerSettingsErrorCodes,
  type LedgerSettingsErrorCode,
} from "internal/ledger/errors/ledgerSettings";
import type {
  LedgerSettingsRepository,
  UpdateLedgerBaseSettingsInput,
  UpdateLedgerMemberSettingsInput,
} from "internal/ledger/repository/ledgerSettingsRepository";
import {
  AppError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ValidationError,
} from "internal/shared/errors/appError";
import {
  getStableFallbackThemeColorKey,
  isThemeColorKey,
  type ThemeColorKey,
} from "theme/themeColorTokens";
import type { LedgerSettingsView as LedgerSettingsViewData } from "types/ledgers";

export type LedgerSettingsServiceDependencies = {
  ledgerSettingsRepository: LedgerSettingsRepository;
};

// Service 只负责账本基础信息和成员信息；pendingInvites 由 ledgerInviteService
// 单独提供，调用方（页面）负责组合成完整的 LedgerSettingsView。
export type LedgerSettingsView = Omit<LedgerSettingsViewData, "pendingInvites">;

export type GetLedgerSettingsViewInput = {
  currentLedger: CurrentLedger;
  ledger: CurrentLedger;
  userId: string;
};

export type UpdateLedgerSettingsInput =
  | {
      intent: "ledger";
      ledgerId: string;
      settings: Omit<UpdateLedgerBaseSettingsInput, "updatedBy">;
      userId: string;
    }
  | {
      intent: "member";
      ledgerId: string;
      settings: Omit<UpdateLedgerMemberSettingsInput, "ledgerId">;
      userId: string;
    };

export type LedgerSettingsService = {
  getView(input: GetLedgerSettingsViewInput): Promise<LedgerSettingsView>;
  update(input: UpdateLedgerSettingsInput): Promise<void>;
};

function toAppError(code: LedgerSettingsErrorCode): AppError {
  const message = "操作失败，请稍后重试。";

  switch (code) {
    case ledgerSettingsErrorCodes.authRequired:
      return new AuthenticationError(code, message);
    case ledgerSettingsErrorCodes.permissionDenied:
      return new AuthorizationError(code, "没有权限执行该操作。");
    case ledgerSettingsErrorCodes.ledgerInvalid:
    case ledgerSettingsErrorCodes.memberInvalid:
      return new NotFoundError(code, "账本或成员不存在。");
    case ledgerSettingsErrorCodes.currencyInvalid:
    case ledgerSettingsErrorCodes.displayColorInvalid:
    case ledgerSettingsErrorCodes.displayNameRequired:
    case ledgerSettingsErrorCodes.displayNameTooLong:
    case ledgerSettingsErrorCodes.nameRequired:
    case ledgerSettingsErrorCodes.nameTooLong:
    case ledgerSettingsErrorCodes.roleInvalid:
      return new ValidationError(code, "提交内容不合法，请检查后重试。");
    default:
      return new AppError(code, message);
  }
}

function normalizeDisplayColor(
  color: string | null,
  fallbackSeed: string,
): ThemeColorKey {
  return color && isThemeColorKey(color)
    ? color
    : getStableFallbackThemeColorKey(fallbackSeed);
}

/**
 * Ledger 设置相关的 UseCase：账本基础信息、账本成员显示设置。
 * 资源级权限判断（是否 owner/admin、是否本人）独立成立，不依赖
 * Router middleware。
 */
export function createLedgerSettingsService({
  ledgerSettingsRepository,
}: LedgerSettingsServiceDependencies): LedgerSettingsService {
  return {
    async getView({ currentLedger, ledger, userId }) {
      const members = await ledgerSettingsRepository.listActiveMembers(
        ledger.id,
      );
      const currentUserMember = members.find(
        (member) => member.userId === userId,
      );

      if (!currentUserMember) {
        throw toAppError(ledgerSettingsErrorCodes.permissionDenied);
      }

      const canEditLedger =
        currentUserMember.role === "owner" ||
        currentUserMember.role === "admin";

      return {
        canEditLedger,
        currentUser: {
          displayColor: normalizeDisplayColor(
            currentUserMember.displayColor,
            userId,
          ),
          displayName: currentUserMember.displayName ?? "未命名用户",
          userId,
        },
        ledger: {
          baseCurrency: ledger.baseCurrency,
          currentUserRole: ledger.currentUserRole,
          id: ledger.id,
          isCurrent: currentLedger.id === ledger.id,
          name: ledger.name,
        },
        members: members.map((member) => ({
          avatarUrl: member.avatarUrl,
          displayColor: normalizeDisplayColor(
            member.displayColor,
            member.userId,
          ),
          displayName: member.displayName ?? "未命名用户",
          email: member.email,
          role: member.role,
          userId: member.userId,
        })),
      };
    },

    async update(input) {
      const role = await ledgerSettingsRepository.getMemberRole(
        input.ledgerId,
        input.userId,
      );

      if (!role) {
        throw toAppError(ledgerSettingsErrorCodes.ledgerInvalid);
      }

      const isLedgerActive = await ledgerSettingsRepository.isLedgerActive(
        input.ledgerId,
      );

      if (!isLedgerActive) {
        throw toAppError(ledgerSettingsErrorCodes.ledgerInvalid);
      }

      const canEditLedger = role === "owner" || role === "admin";

      if (input.intent === "ledger") {
        if (!canEditLedger) {
          throw toAppError(ledgerSettingsErrorCodes.permissionDenied);
        }

        const result = await ledgerSettingsRepository.updateLedgerBaseSettings(
          input.ledgerId,
          { ...input.settings, updatedBy: input.userId },
        );

        if (!result.ok) {
          throw toAppError(result.code);
        }

        return;
      }

      const isOwnMemberSettings = input.settings.userId === input.userId;

      if (!canEditLedger && !isOwnMemberSettings) {
        throw toAppError(ledgerSettingsErrorCodes.permissionDenied);
      }

      // 普通成员只能维护自己的昵称与个性色，不能借这条路径给自己提权。
      if (!canEditLedger && input.settings.role !== role) {
        throw toAppError(ledgerSettingsErrorCodes.permissionDenied);
      }

      const result = await ledgerSettingsRepository.updateMemberSettings({
        ...input.settings,
        ledgerId: input.ledgerId,
      });

      if (!result.ok) {
        throw toAppError(result.code);
      }
    },
  };
}
