import type {
  AccountImportHolder,
  AccountImportHolderRef,
  AccountImportService,
} from "internal/account";
import type {
  CategoryImportEntry,
  CategoryImportService,
  CategoryType,
} from "internal/category";
import type {
  ImportBatchResult,
  ImportExecutionDetail,
  ImportExecutionRowResult,
  ImportExecutionSheetKind,
} from "internal/dataImport/entity/importExecution";
import type {
  ImportExecutionUnit,
  ImportTransactionGroup,
  IncomeExpenseImportRow,
  TransferImportRow,
} from "internal/dataImport/entity/importRow";
import {
  dataImportErrorCodes,
  dataImportExecutionErrorMessages,
} from "internal/dataImport/errors";
import type {
  ImportHolderMapping,
  ResolvedImportHolderMappingValue,
} from "internal/dataImport/schema";
import {
  ledgerPlaceholderMemberErrorCodes,
  type LedgerPlaceholderImportService,
  type LedgerPlaceholderMemberSummary,
} from "internal/ledger";
import type { MerchantImportService } from "internal/merchant";
import {
  AppError,
  ConflictError,
  ValidationError,
} from "internal/shared/errors/appError";
import type { Logger } from "internal/shared/logging/logger";
import {
  balanceAdjustmentErrorMessages,
  transactionErrorCodes,
} from "internal/transaction";
import type { BalanceAdjustmentImportRow } from "internal/dataImport/entity/importRow";
import type { TransactionImportService } from "internal/transaction";

type DataImportExecutionDependencies = {
  accountImportService: AccountImportService;
  categoryImportService: CategoryImportService;
  ledgerPlaceholderImportService: LedgerPlaceholderImportService;
  logger: Logger;
  merchantImportService: MerchantImportService;
  transactionImportService: TransactionImportService;
};

export type ExecuteImportBatchInput = {
  /** 用户在持有人映射步骤里选择的「姓名 → 持有人」；优先于按显示名匹配。 */
  holderMapping?: ImportHolderMapping;
  ledgerId: string;
  timeZoneOffsetMinutes: number;
  /** 浏览器端已解析好的这一批执行单元，数量不得超过 `importBatchSize`。 */
  units: ImportExecutionUnit[];
  userId: string;
};

/** 新建意图都已换成待邀请成员 ID 的映射，后续批次只提交这一份。 */
export type ResolvedImportHolderMapping = Record<
  string,
  ResolvedImportHolderMappingValue
>;

export type ExecuteImportBatchOutput = ImportBatchResult & {
  resolvedHolderMapping: ResolvedImportHolderMapping;
};

export type ImportHolderMappingOptions = {
  members: AccountImportHolder[];
  /** 未认领的待邀请成员，名字为实时读取的当前名字。 */
  placeholders: LedgerPlaceholderMemberSummary[];
};

export interface DataImportExecutionService {
  executeBatch(
    input: ExecuteImportBatchInput,
  ): Promise<ExecuteImportBatchOutput>;
  /** 持有人映射步骤的下拉候选；与 `executeBatch` 校验映射用的是同一份数据来源。 */
  loadHolderMappingOptions(input: {
    ledgerId: string;
    userId: string;
  }): Promise<ImportHolderMappingOptions>;
}

function resolveUniqueByName<T>(
  values: T[],
  getNames: (value: T) => string[],
  name: string,
): T[] {
  return values.filter((value) => getNames(value).includes(name));
}

function unitRowNumbers(unit: ImportExecutionUnit): number[] {
  return unit.kind === "incomeExpense"
    ? unit.group.rowNumbers
    : [unit.row.rowNumber];
}

function unitContent(unit: ImportExecutionUnit): string {
  if (unit.kind === "transfer") {
    return `${unit.row.transactionAt} ${unit.row.fromAccountName} → ${unit.row.toAccountName} ${unit.row.amount}`;
  }

  if (unit.kind === "balanceAdjustment")
    return `${unit.row.transactionAt} ${unit.row.accountName} ${unit.row.amount > 0 ? "+" : ""}${unit.row.amount}`;
  const first = unit.group.items[0];
  const total = unit.group.items.reduce((sum, item) => sum + item.amount, 0);
  return `${first.transactionAt} ${first.merchantName} ${total}`;
}

function rowResultsForUnit(
  unit: ImportExecutionUnit,
  status: ImportExecutionRowResult["status"],
  reason: string | null,
): ImportExecutionRowResult[] {
  const sheet: ImportExecutionSheetKind = unit.kind;
  return unitRowNumbers(unit).map((rowNumber) => ({
    reason,
    rowNumber,
    sheet,
    status,
  }));
}

function detailForUnit(
  unit: ImportExecutionUnit,
  status: ImportExecutionDetail["status"],
  reason: string,
): ImportExecutionDetail {
  return {
    content: unitContent(unit),
    reason,
    rowNumbers: unitRowNumbers(unit),
    sheet: unit.kind,
    status,
  };
}

function categoryKey(
  type: CategoryType,
  parentId: string | null,
  name: string,
) {
  return `${type}\u0000${parentId ?? "root"}\u0000${name}`;
}

/** 持有人种类与 ID 一起进入复用键，成员、待邀请成员与无持有人的账户互不混用。 */
function holderKey(holder: AccountImportHolderRef | null) {
  if (!holder) return "none";
  return holder.kind === "member"
    ? `member:${holder.userId.toLowerCase()}`
    : `placeholder:${holder.placeholderId.toLowerCase()}`;
}

function accountKey(
  name: string,
  holder: AccountImportHolderRef | null,
  currency: string,
) {
  return `${name}\u0000${holderKey(holder)}\u0000${currency}`;
}

function hasPlaceholderReference(mapping: ImportHolderMapping) {
  return Object.values(mapping).some(
    (value) => value.kind === "placeholder" || value.kind === "newPlaceholder",
  );
}

/**
 * 小文件导入的同步批处理编排。文件由浏览器端解析，每次调用只接收并执行这一批
 * 已解析好的执行单元；每个逻辑交易单独捕获执行期错误，因此一条失败不会回滚
 * 已成功的其它交易。真正脱离浏览器的后台任务不属于本 Service 的职责。
 */
export function createDataImportExecutionService({
  accountImportService,
  categoryImportService,
  ledgerPlaceholderImportService,
  logger,
  merchantImportService,
  transactionImportService,
}: DataImportExecutionDependencies): DataImportExecutionService {
  /**
   * 把本批映射里的新建意图换成待邀请成员 ID：名字去重后只调用一次批量确保，
   * 该调用在单一事务内创建或复用，失败时不留下任何待邀请成员。
   */
  async function resolveNewPlaceholders({
    holderMapping,
    holders,
    ledgerId,
    placeholders,
    userId,
  }: {
    holderMapping: ImportHolderMapping;
    holders: AccountImportHolder[];
    ledgerId: string;
    placeholders: LedgerPlaceholderMemberSummary[];
    userId: string;
  }) {
    const displayNames = [
      ...new Set(
        Object.values(holderMapping).flatMap((value) =>
          value.kind === "newPlaceholder" ? [value.displayName.trim()] : [],
        ),
      ),
    ];
    let placeholderIdByName: ReadonlyMap<string, string> = new Map();
    if (displayNames.length > 0) {
      try {
        placeholderIdByName =
          await ledgerPlaceholderImportService.ensureForImport({
            displayNames,
            ledgerId,
            userId,
          });
      } catch (error) {
        if (
          error instanceof AppError &&
          error.code ===
            ledgerPlaceholderMemberErrorCodes.placeholderNameMemberConflict
        ) {
          throw new ConflictError(
            dataImportErrorCodes.holderMappingConflict,
            dataImportExecutionErrorMessages.newPlaceholderMemberConflict(
              displayNames.filter((name) =>
                holders.some((holder) => holder.displayName === name),
              ),
            ),
          );
        }
        if (
          error instanceof AppError &&
          error.code ===
            ledgerPlaceholderMemberErrorCodes.placeholderNameConflict
        ) {
          throw new ConflictError(
            dataImportErrorCodes.holderMappingConflict,
            dataImportExecutionErrorMessages.newPlaceholderNameConflict,
          );
        }
        throw error;
      }
    }

    const existingPlaceholderIds = new Set(
      placeholders.map(({ id }) => id.toLowerCase()),
    );
    const resolvedHolderMapping: ResolvedImportHolderMapping = {};
    for (const [name, value] of Object.entries(holderMapping)) {
      if (value.kind !== "newPlaceholder") {
        resolvedHolderMapping[name] = value;
        continue;
      }
      const placeholderId = placeholderIdByName.get(value.displayName.trim());
      if (!placeholderId) {
        throw new ValidationError(
          dataImportErrorCodes.referenceInvalid,
          dataImportExecutionErrorMessages.holderMappingInvalid,
        );
      }
      resolvedHolderMapping[name] = { kind: "placeholder", placeholderId };
    }
    const createdPlaceholderCount = [...placeholderIdByName.values()].filter(
      (id) => !existingPlaceholderIds.has(id.toLowerCase()),
    ).length;

    return { createdPlaceholderCount, resolvedHolderMapping };
  }

  return {
    async loadHolderMappingOptions({ ledgerId, userId }) {
      const [accountContext, placeholders] = await Promise.all([
        accountImportService.loadContext({ ledgerId, userId }),
        ledgerPlaceholderImportService.listUnclaimed({ ledgerId, userId }),
      ]);
      return { members: accountContext.holders, placeholders };
    },

    async executeBatch({
      holderMapping = {},
      ledgerId,
      timeZoneOffsetMinutes,
      units,
      userId,
    }) {
      const [categoryEntries, merchantContext, accountContext, placeholders] =
        await Promise.all([
          categoryImportService.listCategories({ ledgerId, userId }),
          merchantImportService.loadContext({ ledgerId }),
          accountImportService.loadContext({ ledgerId, userId }),
          hasPlaceholderReference(holderMapping)
            ? ledgerPlaceholderImportService.listUnclaimed({ ledgerId, userId })
            : Promise.resolve([]),
        ]);

      const categories = [...categoryEntries];
      const merchants = [...merchantContext.merchants];
      const merchantTags = [...merchantContext.tags];
      const accounts = [...accountContext.accounts];
      const holders = [...accountContext.holders];
      // 映射来自客户端，不能信任：写入任何数据之前，成员必须是当前账本的有效成员，
      // 待邀请成员必须属于当前账本且未认领，否则整批拒绝。
      if (
        Object.values(holderMapping).some((value) =>
          value.kind === "member"
            ? !holders.some(
                (holder) =>
                  holder.userId.toLowerCase() === value.userId.toLowerCase(),
              )
            : value.kind === "placeholder"
              ? !placeholders.some(
                  (placeholder) =>
                    placeholder.id.toLowerCase() ===
                    value.placeholderId.toLowerCase(),
                )
              : false,
        )
      ) {
        throw new ValidationError(
          dataImportErrorCodes.referenceInvalid,
          dataImportExecutionErrorMessages.holderMappingInvalid,
        );
      }
      // 新建意图最先写入：批量确保内部独立校验 owner/admin，失败时本批不执行。
      const { createdPlaceholderCount, resolvedHolderMapping } =
        await resolveNewPlaceholders({
          holderMapping,
          holders,
          ledgerId,
          placeholders,
          userId,
        });
      const categoryByKey = new Map(
        categories.map((category) => [
          categoryKey(category.type, category.parentId, category.name),
          category,
        ]),
      );
      const accountByKey = new Map<string, typeof accounts>();
      for (const account of accounts) {
        const key = accountKey(account.name, account.holder, account.currency);
        accountByKey.set(key, [...(accountByKey.get(key) ?? []), account]);
      }

      /**
       * 持有人姓名在账本成员里找不到匹配、也没有在映射里明确选择时不阻断导入：
       * 按「无持有人」继续导入并单独提示，而不是直接判定整条记录失败（Refs #780）。
       */
      function resolveHolder(holderName: string | null): {
        holder: AccountImportHolderRef | null;
        missingName: string | null;
      } {
        if (!holderName) {
          return { holder: null, missingName: null };
        }
        // 用户在映射步骤里明确选择过的姓名（含「无持有人」、待邀请成员）优先，且不再算未匹配。
        if (Object.hasOwn(resolvedHolderMapping, holderName)) {
          const value = resolvedHolderMapping[holderName];
          return {
            holder:
              value.kind === "member"
                ? { kind: "member", userId: value.userId }
                : value.kind === "placeholder"
                  ? { kind: "placeholder", placeholderId: value.placeholderId }
                  : null,
            missingName: null,
          };
        }
        const matches = holders.filter(
          (holder) => holder.displayName === holderName,
        );
        if (matches.length === 0) {
          return { holder: null, missingName: holderName };
        }
        if (matches.length > 1) {
          throw new ValidationError(
            dataImportErrorCodes.referenceInvalid,
            dataImportExecutionErrorMessages.holderAmbiguous(holderName),
          );
        }
        return {
          holder: { kind: "member", userId: matches[0].userId },
          missingName: null,
        };
      }

      async function resolveAccount(input: {
        rejectArchived?: boolean;
        currency: string;
        holderName: string | null;
        name: string;
      }) {
        const { holder, missingName: holderMissingName } = resolveHolder(
          input.holderName,
        );
        const key = accountKey(input.name, holder, input.currency);
        const candidates = accountByKey.get(key) ?? [];
        const matches = candidates.filter((account) => !account.isArchived);
        if (
          input.rejectArchived &&
          matches.length === 0 &&
          candidates.length > 0
        ) {
          throw new ValidationError(
            transactionErrorCodes.balanceAdjustmentAccountArchived,
            balanceAdjustmentErrorMessages.archivedCreate,
          );
        }
        if (matches.length > 1) {
          throw new ValidationError(
            dataImportErrorCodes.referenceInvalid,
            dataImportExecutionErrorMessages.accountAmbiguous(input.name),
          );
        }
        if (matches.length === 1) {
          return { account: matches[0], holderMissingName };
        }

        const created = await accountImportService.createAccount({
          currency: input.currency,
          holder,
          ledgerId,
          name: input.name,
          userId,
        });
        const account = {
          isArchived: false,
          currency: input.currency,
          holder,
          id: created.accountId,
          name: input.name,
        };
        accounts.push(account);
        accountByKey.set(key, [account]);
        return { account, holderMissingName };
      }

      async function resolveCategory(input: {
        childName: string | null;
        parentName: string;
        type: CategoryType;
      }): Promise<CategoryImportEntry> {
        if (!input.childName) {
          throw new ValidationError(
            dataImportErrorCodes.referenceInvalid,
            dataImportExecutionErrorMessages.childCategoryRequired(
              input.parentName,
            ),
          );
        }

        const rootKey = categoryKey(input.type, null, input.parentName);
        let parent = categoryByKey.get(rootKey);
        if (!parent) {
          const created = await categoryImportService.createCategory({
            ledgerId,
            name: input.parentName,
            parentId: null,
            type: input.type,
            userId,
          });
          parent = {
            id: created.categoryId,
            name: input.parentName,
            parentId: null,
            type: input.type,
          };
          categories.push(parent);
          categoryByKey.set(rootKey, parent);
        }

        const childKey = categoryKey(input.type, parent.id, input.childName);
        let child = categoryByKey.get(childKey);
        if (!child) {
          const created = await categoryImportService.createCategory({
            ledgerId,
            name: input.childName,
            parentId: parent.id,
            type: input.type,
            userId,
          });
          child = {
            id: created.categoryId,
            name: input.childName,
            parentId: parent.id,
            type: input.type,
          };
          categories.push(child);
          categoryByKey.set(childKey, child);
        }
        return child;
      }

      async function resolveMerchantTag(name: string | null) {
        if (!name) return null;
        let tag = merchantTags.find((candidate) => candidate.name === name);
        if (!tag) {
          const created = await merchantImportService.createTag({
            ledgerId,
            name,
          });
          tag = { id: created.tagId, name };
          merchantTags.push(tag);
        }
        return tag;
      }

      async function resolveMerchant(name: string, tagName: string | null) {
        const matches = resolveUniqueByName(
          merchants,
          (merchant) => merchant.matchNames,
          name,
        );
        if (matches.length > 1) {
          throw new ValidationError(
            dataImportErrorCodes.referenceInvalid,
            dataImportExecutionErrorMessages.merchantAmbiguous(name),
          );
        }

        const tag = await resolveMerchantTag(tagName);
        if (matches.length === 1) {
          const merchant = matches[0];
          if (tag && !merchant.tagIds.includes(tag.id)) {
            await merchantImportService.addTag({
              ledgerId,
              merchantId: merchant.id,
              tagId: tag.id,
            });
            merchant.tagIds.push(tag.id);
          }
          return merchant;
        }

        const created = await merchantImportService.createMerchant({
          ledgerId,
          name,
          tagIds: tag ? [tag.id] : [],
        });
        const merchant = {
          id: created.merchantId,
          matchNames: [name],
          tagIds: tag ? [tag.id] : [],
        };
        merchants.push(merchant);
        return merchant;
      }

      async function executeIncomeExpense(group: ImportTransactionGroup) {
        const first = group.items[0] as IncomeExpenseImportRow;
        const { account, holderMissingName } = await resolveAccount({
          currency: first.accountCurrency,
          holderName: first.accountHolder,
          name: first.accountName,
        });
        const merchant = await resolveMerchant(
          first.merchantName,
          first.merchantTag,
        );
        const items = [];
        for (const sourceItem of group.items) {
          const category = await resolveCategory({
            childName: sourceItem.childCategoryName,
            parentName: sourceItem.parentCategoryName,
            type: sourceItem.transactionType,
          });
          items.push({ amount: sourceItem.amount, categoryId: category.id });
        }
        const totalAmount = group.items.reduce(
          (sum, item) => sum + item.amount,
          0,
        );
        const input = {
          accountId: account.id,
          items,
          ledgerId,
          merchantId: merchant.id,
          note: first.note,
          timeZoneOffsetMinutes,
          transactionAt: first.transactionAt,
          type: first.transactionType,
        } as const;
        const duplicate =
          await transactionImportService.hasPossibleNormalDuplicate({
            ...input,
            totalAmount,
          });
        await transactionImportService.createNormal(input);
        return {
          duplicate,
          holderMissingNames: holderMissingName ? [holderMissingName] : [],
        };
      }

      async function executeBalanceAdjustment(row: BalanceAdjustmentImportRow) {
        const { account, holderMissingName } = await resolveAccount({
          rejectArchived: true,
          currency: row.accountCurrency,
          holderName: row.accountHolder,
          name: row.accountName,
        });
        const input = {
          accountId: account.id,
          ledgerId,
          note: row.note,
          timeZoneOffsetMinutes,
          transactionAt: row.transactionAt,
          signedDelta: row.amount,
        };
        const duplicate =
          await transactionImportService.hasPossibleBalanceAdjustmentDuplicate(
            input,
          );
        await transactionImportService.createBalanceAdjustment(input);
        return {
          duplicate,
          holderMissingNames: holderMissingName ? [holderMissingName] : [],
        };
      }

      async function executeTransfer(row: TransferImportRow) {
        const { account: fromAccount, holderMissingName: fromHolderMissing } =
          await resolveAccount({
            currency: row.fromAccountCurrency,
            holderName: row.fromAccountHolder,
            name: row.fromAccountName,
          });
        const { account: toAccount, holderMissingName: toHolderMissing } =
          await resolveAccount({
            currency: row.toAccountCurrency,
            holderName: row.toAccountHolder,
            name: row.toAccountName,
          });
        const input = {
          accountId: fromAccount.id,
          ledgerId,
          note: row.note,
          timeZoneOffsetMinutes,
          transactionAt: row.transactionAt,
          transferAmount: row.amount,
          transferTargetAccountId: toAccount.id,
        };
        const duplicate =
          await transactionImportService.hasPossibleTransferDuplicate(input);
        await transactionImportService.createTransfer(input);
        return {
          duplicate,
          holderMissingNames: [fromHolderMissing, toHolderMissing].filter(
            (name): name is string => name !== null,
          ),
        };
      }

      const rowResults: ImportExecutionRowResult[] = [];
      const details: ImportExecutionDetail[] = [];
      let successCount = 0;
      let failureCount = 0;
      let duplicateCount = 0;
      let holderMissingCount = 0;

      for (const unit of units) {
        try {
          const { duplicate, holderMissingNames } =
            unit.kind === "incomeExpense"
              ? await executeIncomeExpense(unit.group)
              : unit.kind === "transfer"
                ? await executeTransfer(unit.row)
                : await executeBalanceAdjustment(unit.row);
          successCount += 1;
          if (holderMissingNames.length > 0) {
            holderMissingCount += 1;
            const reason = [
              ...[...new Set(holderMissingNames)].map((name) =>
                dataImportExecutionErrorMessages.holderMissingWarning(name),
              ),
              ...(duplicate
                ? [dataImportExecutionErrorMessages.duplicateWarning]
                : []),
            ].join("；");
            details.push(detailForUnit(unit, "holderMissing", reason));
            rowResults.push(
              ...rowResultsForUnit(unit, "holderMissing", reason),
            );
          } else if (duplicate) {
            duplicateCount += 1;
            details.push(
              detailForUnit(
                unit,
                "duplicate",
                dataImportExecutionErrorMessages.duplicateWarning,
              ),
            );
            rowResults.push(
              ...rowResultsForUnit(
                unit,
                "duplicate",
                dataImportExecutionErrorMessages.duplicateWarning,
              ),
            );
          } else {
            rowResults.push(...rowResultsForUnit(unit, "success", null));
          }
        } catch (error) {
          failureCount += 1;
          const reason =
            error instanceof AppError
              ? error.message
              : dataImportExecutionErrorMessages.rowFailed;
          if (!(error instanceof AppError)) {
            logger.error("[dataImport] failed to import row unexpectedly", {
              errorName: error instanceof Error ? error.name : "unknown",
              ledgerId,
              rowNumbers: unitRowNumbers(unit),
              sheet: unit.kind,
            });
          }
          details.push(detailForUnit(unit, "failed", reason));
          rowResults.push(...rowResultsForUnit(unit, "failed", reason));
        }
      }

      return {
        createdPlaceholderCount,
        details,
        duplicateCount,
        failureCount,
        holderMissingCount,
        processedCount: units.length,
        resolvedHolderMapping,
        rowResults,
        successCount,
      };
    },
  };
}
