import type { CurrentLedger } from "internal/ledger";
import {
  ConflictError,
  ValidationError,
} from "internal/shared/errors/appError";
import {
  transactionErrorCodes,
  transactionLinkedEditErrorMessages,
} from "internal/transaction/errors";
import type { UpdateNormalTransactionInput } from "internal/transaction/repository/transactionRepository";
import type { LinkedTransactionItemService } from "internal/transaction/service/linkedTransactionItemService";
import type { EditTransactionView } from "internal/transaction/service/read/transactionReadModels";
import type { TransactionService } from "internal/transaction/service/transactionService";
import { toRefundMinorUnits } from "internal/transaction/util/refundAllocation";

export type LinkedTransactionEditInput = UpdateNormalTransactionInput & {
  confirmSync: boolean;
  expectedUpdatedAtByItemId: Readonly<Record<string, string>>;
};

export type LinkedTransactionEditServiceDependencies = {
  linkedTransactionItemService: LinkedTransactionItemService;
  transactionService: TransactionService;
};

export interface LinkedTransactionEditService {
  updateNormal(
    currentLedger: CurrentLedger,
    input: LinkedTransactionEditInput,
  ): Promise<void>;
  void(
    currentLedger: CurrentLedger,
    input: { ledgerId: string; transactionRecordId: string },
  ): Promise<void>;
}

type NormalEditInitialValues = Extract<
  EditTransactionView["initialValues"],
  { items: unknown[] }
>;
type ExistingItem = NormalEditInitialValues["items"][number];
type SubmittedItem = UpdateNormalTransactionInput["items"][number];

function hasPositiveAmount(value: string | undefined): boolean {
  const amount = Number(value ?? "0");
  return Number.isFinite(amount) && amount > 0;
}

function isLinkedIncome(item: ExistingItem): boolean {
  return item.businessStatus?.incomeLinkRole != null;
}

function isLinkedTarget(item: ExistingItem): boolean {
  const status = item.businessStatus;
  return Boolean(
    status &&
    status.incomeLinkRole === null &&
    (hasPositiveAmount(status.offsetComposition.refundAmount) ||
      hasPositiveAmount(status.offsetComposition.reimbursementAmount)),
  );
}

function isLinkedItem(item: ExistingItem): boolean {
  return isLinkedIncome(item) || isLinkedTarget(item);
}

function hasRefundLink(item: ExistingItem): boolean {
  return Boolean(
    item.businessStatus?.incomeLinkRole === "refund" ||
    hasPositiveAmount(item.businessStatus?.offsetComposition.refundAmount),
  );
}

function hasReimbursementLink(item: ExistingItem): boolean {
  return Boolean(
    item.businessStatus?.incomeLinkRole === "reimbursement" ||
    hasPositiveAmount(
      item.businessStatus?.offsetComposition.reimbursementAmount,
    ),
  );
}

function sameAmount(left: string | number, right: string | number): boolean {
  const leftUnits = toRefundMinorUnits(left);
  const rightUnits = toRefundMinorUnits(right);
  return leftUnits !== null && rightUnits !== null && leftUnits === rightUnits;
}

function getNormalInitialValues(
  view: EditTransactionView,
): NormalEditInitialValues {
  if (!("items" in view.initialValues)) {
    throw new ValidationError(
      transactionErrorCodes.updateInvalid,
      "编辑对象不正确。",
    );
  }
  return view.initialValues;
}

function buildSubmittedItemMap(items: SubmittedItem[]) {
  return new Map(
    items.flatMap((item) => (item.id ? [[item.id, item] as const] : [])),
  );
}

function throwUnlinkRequired(): never {
  throw new ValidationError(
    transactionErrorCodes.linkedEditRequiresUnlink,
    transactionLinkedEditErrorMessages.unlinkRequired,
  );
}

function throwSpecialStatusLocked(): never {
  throw new ValidationError(
    transactionErrorCodes.specialStatusInvalid,
    transactionLinkedEditErrorMessages.specialStatusLocked,
  );
}

function getSubmittedSpecialStatus(
  existing: ExistingItem,
  submitted: SubmittedItem,
) {
  return submitted.specialStatus === undefined
    ? existing.specialStatus
    : submitted.specialStatus;
}

function validateProtectedStatuses(
  initial: NormalEditInitialValues,
  submittedById: Map<string, SubmittedItem>,
  categoryTypeById: Map<string, "expense" | "income">,
): void {
  for (const item of initial.items) {
    if (!item.id || item.specialStatus === null) continue;
    const submitted = submittedById.get(item.id);
    if (!submitted) continue;
    if (getSubmittedSpecialStatus(item, submitted) !== item.specialStatus) {
      throwSpecialStatusLocked();
    }
    if (
      submitted.categoryId !== item.categoryId &&
      categoryTypeById.get(submitted.categoryId) !== "expense"
    ) {
      throwSpecialStatusLocked();
    }
  }
}

function validateAssociationUnchanged(
  existing: ExistingItem,
  submitted: SubmittedItem,
): void {
  const role = existing.businessStatus?.incomeLinkRole;
  if (role === "refund") {
    if (
      submitted.refundedItemId !== existing.refundCandidate?.id ||
      submitted.reimbursementItemId !== undefined
    ) {
      throwUnlinkRequired();
    }
  }
  if (role === "reimbursement") {
    if (
      submitted.reimbursementItemId !== existing.reimbursementCandidate?.id ||
      submitted.refundedItemId !== undefined
    ) {
      throwUnlinkRequired();
    }
  }
}

function hasSiblingItemMutation(
  initial: NormalEditInitialValues,
  input: LinkedTransactionEditInput,
  linkedItemIds: Set<string>,
  submittedById: Map<string, SubmittedItem>,
): boolean {
  const currentIds = new Set(
    initial.items.flatMap((item) => (item.id ? [item.id] : [])),
  );
  if (input.items.some((item) => !item.id || !currentIds.has(item.id))) {
    return true;
  }

  for (const current of initial.items) {
    if (!current.id || linkedItemIds.has(current.id)) continue;
    const submitted = submittedById.get(current.id);
    if (!submitted) return true;
    if (
      submitted.categoryId !== current.categoryId ||
      !sameAmount(submitted.amount, current.amount) ||
      input.accountId !== initial.accountId ||
      getSubmittedSpecialStatus(current, submitted) !== current.specialStatus ||
      (submitted.refundedItemId ?? null) !==
        (current.refundCandidate?.id ?? null) ||
      (submitted.reimbursementItemId ?? null) !==
        (current.reimbursementCandidate?.id ?? null)
    ) {
      return true;
    }
  }
  return false;
}

export function createLinkedTransactionEditService({
  linkedTransactionItemService,
  transactionService,
}: LinkedTransactionEditServiceDependencies): LinkedTransactionEditService {
  return {
    async updateNormal(currentLedger, input) {
      const canModify = await transactionService.canModify({
        ledgerId: input.ledgerId,
        transactionRecordId: input.transactionRecordId,
      });
      if (!canModify) {
        await transactionService.updateNormal(input);
        return;
      }

      const view = await transactionService.getEditView(
        currentLedger,
        input.transactionRecordId,
      );
      if (!view) {
        await transactionService.updateNormal(input);
        return;
      }
      const initial = getNormalInitialValues(view);
      const submittedById = buildSubmittedItemMap(input.items);
      const categoryTypeById = new Map(
        view.categoryOptions.map(
          (category) => [category.id, category.type] as const,
        ),
      );
      validateProtectedStatuses(initial, submittedById, categoryTypeById);

      const linkedItems = initial.items.filter(isLinkedItem);
      if (linkedItems.length === 0) {
        await transactionService.updateNormal(input);
        return;
      }

      const linkedItemIds = new Set(
        linkedItems.flatMap((item) => (item.id ? [item.id] : [])),
      );
      for (const linkedItem of linkedItems) {
        if (!linkedItem.id || !submittedById.has(linkedItem.id)) {
          throw new ValidationError(
            transactionErrorCodes.linkedDeleteForbidden,
            transactionLinkedEditErrorMessages.deleteForbidden,
          );
        }
      }

      if (
        hasSiblingItemMutation(initial, input, linkedItemIds, submittedById)
      ) {
        throw new ValidationError(
          transactionErrorCodes.linkedEditRequiresUnlink,
          transactionLinkedEditErrorMessages.unsupportedSiblingEdit,
        );
      }

      const accountChanged = input.accountId !== initial.accountId;
      const oldAccount = view.accountOptions.find(
        (account) => account.id === initial.accountId,
      );
      const newAccount = view.accountOptions.find(
        (account) => account.id === input.accountId,
      );
      if (accountChanged && !newAccount) {
        throw new ValidationError(
          transactionErrorCodes.accountInvalid,
          "账户指定不正确。",
        );
      }
      if (accountChanged && linkedItems.some(hasRefundLink)) {
        throw new ValidationError(
          transactionErrorCodes.refundLinkInvalid,
          transactionLinkedEditErrorMessages.refundAccountMismatch,
        );
      }
      if (
        accountChanged &&
        linkedItems.some(hasReimbursementLink) &&
        oldAccount &&
        oldAccount.currency !== newAccount?.currency
      ) {
        throw new ValidationError(
          transactionErrorCodes.reimbursementLinkInvalid,
          transactionLinkedEditErrorMessages.reimbursementCurrencyMismatch,
        );
      }

      const changedLinkedItems: Array<{
        existing: ExistingItem;
        submitted: SubmittedItem;
      }> = [];
      for (const existing of linkedItems) {
        if (!existing.id) throwUnlinkRequired();
        const submitted = submittedById.get(existing.id);
        if (!submitted) {
          throw new ValidationError(
            transactionErrorCodes.linkedDeleteForbidden,
            transactionLinkedEditErrorMessages.deleteForbidden,
          );
        }
        if (
          getSubmittedSpecialStatus(existing, submitted) !==
          existing.specialStatus
        ) {
          if (existing.specialStatus !== null) throwSpecialStatusLocked();
          throwUnlinkRequired();
        }
        validateAssociationUnchanged(existing, submitted);
        const categoryChanged = submitted.categoryId !== existing.categoryId;
        const categoryType = categoryTypeById.get(submitted.categoryId);
        if (categoryChanged && !categoryType) {
          throw new ValidationError(
            transactionErrorCodes.categoryInvalid,
            "分类指定不正确。",
          );
        }
        if (
          categoryChanged &&
          ((isLinkedIncome(existing) && categoryType !== "income") ||
            (isLinkedTarget(existing) && categoryType !== "expense"))
        ) {
          throwUnlinkRequired();
        }
        if (
          accountChanged ||
          categoryChanged ||
          !sameAmount(submitted.amount, existing.amount)
        ) {
          changedLinkedItems.push({ existing, submitted });
        }
      }

      const typeChanged = input.type !== initial.type;
      if (
        (changedLinkedItems.length > 0 || typeChanged) &&
        !input.confirmSync
      ) {
        throw new ConflictError(
          transactionErrorCodes.linkedSyncConfirmationRequired,
          transactionLinkedEditErrorMessages.confirmationRequired,
        );
      }

      const itemUpdates = changedLinkedItems.map(({ existing, submitted }) => {
        if (!existing.id) throwUnlinkRequired();
        const expectedUpdatedAt = input.expectedUpdatedAtByItemId[existing.id];
        if (!expectedUpdatedAt) {
          throw new ConflictError(
            transactionErrorCodes.linkedVersionInvalid,
            transactionLinkedEditErrorMessages.versionInvalid,
          );
        }
        return {
          accountId: input.accountId,
          amount: submitted.amount,
          categoryId: submitted.categoryId,
          expectedUpdatedAt,
          transactionItemId: existing.id,
        };
      });

      if (
        input.merchantId !== initial.merchantId &&
        !view.merchantOptions.some(
          (merchant) => merchant.id === input.merchantId,
        )
      ) {
        throw new ValidationError(
          transactionErrorCodes.merchantInvalid,
          "商家指定不正确。",
        );
      }

      const metadataChanged =
        input.merchantId !== initial.merchantId ||
        input.note !== (initial.note || null) ||
        input.transactionAt !== initial.transactionAt;
      if (itemUpdates.length === 0 && !metadataChanged && !typeChanged) return;

      await linkedTransactionItemService.updateEdit({
        itemUpdates,
        ledgerId: input.ledgerId,
        merchantId: input.merchantId,
        note: input.note,
        transactionAt: input.transactionAt,
        transactionRecordId: input.transactionRecordId,
      });
    },

    async void(currentLedger, input) {
      const canModify = await transactionService.canModify(input);
      if (!canModify) {
        await transactionService.void(input);
        return;
      }
      const view = await transactionService.getEditView(
        currentLedger,
        input.transactionRecordId,
      );
      if (view && "items" in view.initialValues) {
        if (view.initialValues.items.some(isLinkedItem)) {
          throw new ValidationError(
            transactionErrorCodes.linkedDeleteForbidden,
            transactionLinkedEditErrorMessages.deleteForbidden,
          );
        }
      }
      await transactionService.void(input);
    },
  };
}
