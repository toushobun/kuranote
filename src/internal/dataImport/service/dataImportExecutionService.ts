import type { AccountImportService } from "internal/account";
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
  ImportTransactionGroup,
  IncomeExpenseImportRow,
  TransferImportRow,
} from "internal/dataImport/entity/importRow";
import {
  dataImportErrorCodes,
  dataImportExecutionErrorMessages,
} from "internal/dataImport/errors";
import { detectSheetKind } from "internal/dataImport/util/detectSheetKind";
import { groupIncomeExpenseRows } from "internal/dataImport/util/groupIncomeExpenseRows";
import { parseImportFile } from "internal/dataImport/util/parseImportFile";
import { parseIncomeExpenseSheet } from "internal/dataImport/util/parseIncomeExpenseSheet";
import { parseTransferSheet } from "internal/dataImport/util/parseTransferSheet";
import { validateImportWorkbook } from "internal/dataImport/util/validateImportWorkbook";
import type { MerchantImportService } from "internal/merchant";
import { AppError, ValidationError } from "internal/shared/errors/appError";
import type { Logger } from "internal/shared/logging/logger";
import type { TransactionImportService } from "internal/transaction";

const importBatchSize = 25;

type ImportExecutionUnit =
  | { group: ImportTransactionGroup; kind: "incomeExpense" }
  | { kind: "transfer"; row: TransferImportRow };

type DataImportExecutionDependencies = {
  accountImportService: AccountImportService;
  categoryImportService: CategoryImportService;
  logger: Logger;
  merchantImportService: MerchantImportService;
  transactionImportService: TransactionImportService;
};

export type ExecuteImportBatchInput = {
  fileBuffer: ArrayBuffer;
  fileName: string;
  ledgerId: string;
  offset: number;
  timeZoneOffsetMinutes: number;
  userId: string;
};

export interface DataImportExecutionService {
  executeBatch(input: ExecuteImportBatchInput): Promise<ImportBatchResult>;
}

function executionInvalid(): ValidationError {
  return new ValidationError(
    dataImportErrorCodes.executionInvalid,
    "导入文件或进度信息已变化，请重新检查格式后再导入。",
  );
}

async function parseExecutionUnits(
  fileName: string,
  fileBuffer: ArrayBuffer,
): Promise<ImportExecutionUnit[]> {
  const parsed = await parseImportFile(fileName, fileBuffer);
  if (!parsed.ok) throw executionInvalid();

  const validation = validateImportWorkbook(parsed.tables);
  if (!validation.ok) throw executionInvalid();

  const incomeExpenseRows = parsed.tables
    .filter((table) => detectSheetKind(table.sourceName) === "incomeExpense")
    .flatMap((table) => parseIncomeExpenseSheet(table).rows);
  const grouped = groupIncomeExpenseRows(incomeExpenseRows);
  if (grouped.issues.length > 0) throw executionInvalid();

  const transferRows = parsed.tables
    .filter((table) => detectSheetKind(table.sourceName) === "transfer")
    .flatMap((table) => parseTransferSheet(table).rows);

  return [
    ...grouped.groups.map(
      (group): ImportExecutionUnit => ({ group, kind: "incomeExpense" }),
    ),
    ...transferRows.map(
      (row): ImportExecutionUnit => ({ kind: "transfer", row }),
    ),
  ];
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

function accountKey(
  name: string,
  holderUserId: string | null,
  currency: string,
) {
  return `${name}\u0000${holderUserId ?? ""}\u0000${currency}`;
}

/**
 * 小文件导入的同步批处理编排。每次调用重新解析同一个 xlsx，只执行当前 offset
 * 对应的固定批次；每个逻辑交易单独捕获执行期错误，因此一条失败不会回滚已成功
 * 的其它交易。真正脱离浏览器的后台任务不属于本 Service 的职责。
 */
export function createDataImportExecutionService({
  accountImportService,
  categoryImportService,
  logger,
  merchantImportService,
  transactionImportService,
}: DataImportExecutionDependencies): DataImportExecutionService {
  return {
    async executeBatch({
      fileBuffer,
      fileName,
      ledgerId,
      offset,
      timeZoneOffsetMinutes,
      userId,
    }) {
      const units = await parseExecutionUnits(fileName, fileBuffer);
      if (!Number.isInteger(offset) || offset < 0 || offset > units.length) {
        throw executionInvalid();
      }

      const [categoryEntries, merchantContext, accountContext] =
        await Promise.all([
          categoryImportService.listCategories({ ledgerId, userId }),
          merchantImportService.loadContext({ ledgerId }),
          accountImportService.loadContext({ ledgerId, userId }),
        ]);

      const categories = [...categoryEntries];
      const merchants = [...merchantContext.merchants];
      const merchantTags = [...merchantContext.tags];
      const accounts = [...accountContext.accounts];
      const holders = [...accountContext.holders];
      const categoryByKey = new Map(
        categories.map((category) => [
          categoryKey(category.type, category.parentId, category.name),
          category,
        ]),
      );
      const accountByKey = new Map<string, typeof accounts>();
      for (const account of accounts) {
        const key = accountKey(
          account.name,
          account.holderUserId,
          account.currency,
        );
        accountByKey.set(key, [...(accountByKey.get(key) ?? []), account]);
      }

      /**
       * 持有人姓名在账本成员里找不到匹配时不阻断导入：账户持有人必须绑定真实
       * 账本成员身份，无法像分类/商家/账户那样凭空新建一行数据，因此按「无
       * 持有人」继续导入并单独提示，而不是直接判定整条记录失败（Refs #780）。
       */
      async function resolveHolderUserId(holderName: string | null) {
        if (!holderName) {
          return { missingName: null, userId: null };
        }
        const matches = holders.filter(
          (holder) => holder.displayName === holderName,
        );
        if (matches.length === 0) {
          return { missingName: holderName, userId: null };
        }
        if (matches.length > 1) {
          throw new ValidationError(
            dataImportErrorCodes.referenceInvalid,
            dataImportExecutionErrorMessages.holderAmbiguous(holderName),
          );
        }
        return { missingName: null, userId: matches[0].userId };
      }

      async function resolveAccount(input: {
        currency: string;
        holderName: string | null;
        name: string;
      }) {
        const { missingName: holderMissingName, userId: holderUserId } =
          await resolveHolderUserId(input.holderName);
        const key = accountKey(input.name, holderUserId, input.currency);
        const matches = accountByKey.get(key) ?? [];
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
          holderUserId,
          ledgerId,
          name: input.name,
          userId,
        });
        const account = {
          currency: input.currency,
          holderUserId,
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

      const batch = units.slice(offset, offset + importBatchSize);
      const rowResults: ImportExecutionRowResult[] = [];
      const details: ImportExecutionDetail[] = [];
      let successCount = 0;
      let failureCount = 0;
      let duplicateCount = 0;
      let holderMissingCount = 0;

      for (const unit of batch) {
        try {
          const { duplicate, holderMissingNames } =
            unit.kind === "incomeExpense"
              ? await executeIncomeExpense(unit.group)
              : await executeTransfer(unit.row);
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

      const nextOffset = offset + batch.length;
      return {
        details,
        done: nextOffset >= units.length,
        duplicateCount,
        failureCount,
        holderMissingCount,
        nextOffset,
        processedCount: batch.length,
        rowResults,
        successCount,
        totalCount: units.length,
      };
    },
  };
}
