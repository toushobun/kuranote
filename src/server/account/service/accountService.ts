import {
  canManageMasterData,
  canWriteTransaction,
} from "lib/ledger/permissions";
import { accountErrorCodes } from "server/account/errors";
import type {
  AccountLedgerMemberRecord,
  AccountRepository,
  CreateAccountInput as RepositoryCreateAccountInput,
  UpdateAccountInput as RepositoryUpdateAccountInput,
} from "server/account/repository/accountRepository";
import {
  AppError,
  AuthorizationError,
  NotFoundError,
  ValidationError,
} from "server/shared/errors/appError";
import type {
  AccountHolderOption,
  AccountRow,
  AppUserRecord,
  LedgerMemberDisplaySettingRecord,
} from "types/accounts";
import { accountTypeOptions, type AccountType } from "types/accounts";
import {
  buildAccountsWithHolders,
  buildDisplayColorByUserId,
  buildHolderOptions,
} from "utils/accounts";

export type AccountsView = {
  accounts: AccountRow[];
  baseCurrency: string;
  canManageAccounts: boolean;
  canWriteTransactions: boolean;
  holderOptions: AccountHolderOption[];
  ledgerName: string;
};

export type GetAccountsViewInput = {
  ledgerId: string;
  userId: string;
};

export type CreateAccountInput = Omit<RepositoryCreateAccountInput, "ledgerId"> & {
  ledgerId: string;
  userId: string;
};

export type UpdateAccountInput = RepositoryUpdateAccountInput & {
  userId: string;
};

export type ArchiveAccountInput = {
  accountId: string;
  ledgerId: string;
  userId: string;
};

export interface AccountService {
  archive(input: ArchiveAccountInput): Promise<void>;
  create(input: CreateAccountInput): Promise<{ accountId: string }>;
  getView(input: GetAccountsViewInput): Promise<AccountsView>;
  update(input: UpdateAccountInput): Promise<void>;
}

export type AccountServiceDependencies = {
  accountRepository: AccountRepository;
  now?: () => Date;
};

const accountTypeValues = new Set<AccountType>(
  accountTypeOptions.map((option) => option.value),
);

function normalizeName(name: string): string {
  const normalized = name.trim();
  if (!normalized) {
    throw new ValidationError(accountErrorCodes.nameRequired, "请输入账户名称。");
  }
  return normalized;
}

function normalizeType(type: AccountType): AccountType {
  if (!accountTypeValues.has(type)) {
    throw new ValidationError(accountErrorCodes.typeInvalid, "账户类型不正确。");
  }
  return type;
}

function normalizeCurrency(currency: string): string {
  const normalized = currency.trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(normalized)) {
    throw new ValidationError(
      accountErrorCodes.currencyInvalid,
      "货币必须是 3 位大写字母，例如 JPY。",
    );
  }
  return normalized;
}

function normalizeHolderUserIds(holderUserIds: string[]): string[] {
  const normalized = [
    ...new Set(holderUserIds.map((value) => value.trim())),
  ].filter(Boolean);

  if (normalized.length === 0) {
    throw new ValidationError(
      accountErrorCodes.holderInvalid,
      "账户持有人指定不正确。",
    );
  }

  return normalized;
}

function normalizeInitialBalance(initialBalance: number): number {
  const scaled = initialBalance * 100;
  if (
    !Number.isFinite(initialBalance) ||
    Math.abs(scaled - Math.round(scaled)) > 1e-8
  ) {
    throw new ValidationError(
      accountErrorCodes.initialBalanceInvalid,
      "初始余额必须是最多两位小数的数字。",
    );
  }
  return initialBalance;
}

function mergeLedgerDisplayNames(
  users: AppUserRecord[],
  settings: LedgerMemberDisplaySettingRecord[],
): AppUserRecord[] {
  const settingByUserId = new Map(
    settings.map((setting) => [setting.user_id, setting] as const),
  );

  return users.map((user) => {
    const ledgerDisplayName = settingByUserId
      .get(user.id)
      ?.display_name?.trim();

    return {
      ...user,
      display_name: ledgerDisplayName || user.display_name,
    };
  });
}

/**
 * Account 模块 UseCase。读取和写入均独立确认账本、成员资格与权限，
 * 不假设调用方一定经过 Router middleware 或当前账本页面边界。
 */
export function createAccountService({
  accountRepository,
  now = () => new Date(),
}: AccountServiceDependencies): AccountService {
  async function requireLedgerContext(ledgerId: string, userId: string) {
    const [ledger, members] = await Promise.all([
      accountRepository.findActiveLedger(ledgerId),
      accountRepository.listActiveMembers(ledgerId),
    ]);

    if (!ledger) {
      throw new NotFoundError(
        accountErrorCodes.ledgerInvalid,
        "账本不存在或已停用。",
      );
    }

    const currentMember = members.find((member) => member.user_id === userId);
    if (!currentMember) {
      throw new NotFoundError(
        accountErrorCodes.ledgerInvalid,
        "账本不存在或您不是该账本成员。",
      );
    }

    return { currentMember, ledger, members };
  }

  function requireManagement(role: AccountLedgerMemberRecord["role"]): void {
    if (!canManageMasterData(role)) {
      throw new AuthorizationError(
        accountErrorCodes.permissionDenied,
        "只有账本所有者或管理员可以维护账户。",
      );
    }
  }

  async function requireValidHolders(
    holderUserIds: string[],
    members: AccountLedgerMemberRecord[],
  ): Promise<string[]> {
    const normalized = normalizeHolderUserIds(holderUserIds);
    const activeMemberIds = new Set(members.map((member) => member.user_id));

    if (normalized.some((holderUserId) => !activeMemberIds.has(holderUserId))) {
      throw new ValidationError(
        accountErrorCodes.holderInvalid,
        "账户持有人必须是当前账本的有效成员。",
      );
    }

    const users = await accountRepository.listUsers(normalized);
    const activeUserIds = new Set(
      users.filter((user) => user.status === "active").map((user) => user.id),
    );

    if (normalized.some((holderUserId) => !activeUserIds.has(holderUserId))) {
      throw new ValidationError(
        accountErrorCodes.holderInvalid,
        "账户持有人必须是当前账本的有效成员。",
      );
    }

    return normalized;
  }

  return {
    async archive({ accountId, ledgerId, userId }) {
      const { currentMember } = await requireLedgerContext(ledgerId, userId);
      requireManagement(currentMember.role);

      if (!(await accountRepository.isActiveAccount(ledgerId, accountId))) {
        throw new NotFoundError(
          accountErrorCodes.accountInvalid,
          "账户不存在或已删除。",
        );
      }

      const archived = await accountRepository.archive({
        accountId,
        archivedAt: now().toISOString(),
        ledgerId,
        userId,
      });

      if (!archived) {
        throw new AppError(
          accountErrorCodes.archiveFailed,
          "账户删除失败，请稍后重试。",
        );
      }
    },

    async create(input) {
      const { currentMember, members } = await requireLedgerContext(
        input.ledgerId,
        input.userId,
      );
      requireManagement(currentMember.role);

      const accountId = await accountRepository.create({
        currency: normalizeCurrency(input.currency),
        holderUserIds: await requireValidHolders(
          input.holderUserIds,
          members,
        ),
        initialBalance: normalizeInitialBalance(input.initialBalance),
        ledgerId: input.ledgerId,
        name: normalizeName(input.name),
        type: normalizeType(input.type),
      });

      if (!accountId) {
        throw new AppError(
          accountErrorCodes.createFailed,
          "账户新增失败。请确认账户名称是否重复，或稍后重试。",
        );
      }

      return { accountId };
    },

    async getView({ ledgerId, userId }) {
      const { currentMember, ledger, members } = await requireLedgerContext(
        ledgerId,
        userId,
      );
      const [accounts, displaySettings] = await Promise.all([
        accountRepository.listAccounts(ledgerId),
        accountRepository.listDisplaySettings(ledgerId),
      ]);
      const holders = await accountRepository.listHolders(
        ledgerId,
        accounts.map((account) => account.id),
      );
      const userIds = [
        ...new Set([
          ...members.map((member) => member.user_id),
          ...holders.map((holder) => holder.user_id),
        ]),
      ];
      const users = mergeLedgerDisplayNames(
        await accountRepository.listUsers(userIds),
        displaySettings,
      );
      const appUserById = new Map(users.map((user) => [user.id, user]));

      return {
        accounts: buildAccountsWithHolders({
          accounts,
          appUserById,
          displayColorByUserId: buildDisplayColorByUserId({
            members,
            settings: displaySettings,
          }),
          holders,
        }),
        baseCurrency: ledger.baseCurrency,
        canManageAccounts: canManageMasterData(currentMember.role),
        canWriteTransactions: canWriteTransaction(currentMember.role),
        holderOptions: buildHolderOptions({ appUserById, members }),
        ledgerName: ledger.name,
      };
    },

    async update(input) {
      const { currentMember, members } = await requireLedgerContext(
        input.ledgerId,
        input.userId,
      );
      requireManagement(currentMember.role);

      if (
        !(await accountRepository.isActiveAccount(
          input.ledgerId,
          input.accountId,
        ))
      ) {
        throw new NotFoundError(
          accountErrorCodes.accountInvalid,
          "账户不存在或已删除。",
        );
      }

      const updated = await accountRepository.update({
        accountId: input.accountId,
        currency: normalizeCurrency(input.currency),
        holderUserIds: await requireValidHolders(
          input.holderUserIds,
          members,
        ),
        ledgerId: input.ledgerId,
        name: normalizeName(input.name),
        type: normalizeType(input.type),
      });

      if (!updated) {
        throw new AppError(
          accountErrorCodes.updateFailed,
          "账户更新失败。请确认账户名称是否重复，或稍后重试。",
        );
      }
    },
  };
}
