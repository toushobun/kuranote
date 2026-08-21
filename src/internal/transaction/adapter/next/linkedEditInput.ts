import {
  transactionSpecialStatuses,
  type TransactionSpecialStatus,
} from "internal/transaction/entity/transactionSpecialStatus";
import { transactionErrorCodes } from "internal/transaction/errors";
import { validateUpdateTransactionForm } from "internal/transaction/schema";

export type LinkedEditActionInput = {
  confirmSync: boolean;
  expectedUpdatedAtByItemId: Readonly<Record<string, string>>;
};

const offsetDateTimePattern = /(?:Z|[+-]\d{2}:\d{2})$/;
const expectedUpdatedAtFieldPrefix = "itemExpectedUpdatedAt__";

export function getLinkedEditExpectedUpdatedAtFieldName(itemId: string) {
  return `${expectedUpdatedAtFieldPrefix}${itemId}`;
}

export function validateLinkedEditTransactionForm(formData: FormData) {
  const submittedSpecialStatuses = formData.getAll("itemSpecialStatus");
  if (submittedSpecialStatuses.length === 0) {
    return validateUpdateTransactionForm(formData);
  }

  const itemCount = formData.getAll("itemCategoryId").length;
  if (submittedSpecialStatuses.length !== itemCount) {
    return {
      error: transactionErrorCodes.specialStatusInvalid,
      ok: false,
    } as const;
  }

  const specialStatuses: Array<TransactionSpecialStatus | null> = [];
  for (const rawValue of submittedSpecialStatuses) {
    const value = String(rawValue).trim();
    if (!value) {
      specialStatuses.push(null);
      continue;
    }
    if (!(transactionSpecialStatuses as readonly string[]).includes(value)) {
      return {
        error: transactionErrorCodes.specialStatusInvalid,
        ok: false,
      } as const;
    }
    specialStatuses.push(value as TransactionSpecialStatus);
  }

  const normalizedFormData = new FormData();
  for (const [key, value] of formData.entries()) {
    if (key !== "itemSpecialStatus") normalizedFormData.append(key, value);
  }

  const validation = validateUpdateTransactionForm(normalizedFormData);
  if (!validation.ok) return validation;

  return {
    ok: true,
    value: {
      ...validation.value,
      items: validation.value.items.map((item, index) => ({
        ...item,
        specialStatus: specialStatuses[index] ?? null,
      })),
    },
  } as const;
}

export function parseLinkedEditActionInput(
  formData: FormData,
  itemIds: Array<string | undefined>,
): LinkedEditActionInput | null {
  const confirmSyncText = String(formData.get("confirmSync") ?? "").trim();
  if (confirmSyncText !== "" && confirmSyncText !== "true") return null;

  const submittedItemIds = new Set(itemIds.filter((itemId) => itemId));
  const expectedUpdatedAtByItemId: Record<string, string> = {};
  for (const [key, rawValue] of formData.entries()) {
    if (key === "itemExpectedUpdatedAt") return null;
    if (!key.startsWith(expectedUpdatedAtFieldPrefix)) continue;

    const itemId = key.slice(expectedUpdatedAtFieldPrefix.length);
    const value = String(rawValue).trim();
    if (
      !submittedItemIds.has(itemId) ||
      Object.hasOwn(expectedUpdatedAtByItemId, itemId) ||
      !value ||
      !offsetDateTimePattern.test(value) ||
      !Number.isFinite(Date.parse(value))
    ) {
      return null;
    }
    expectedUpdatedAtByItemId[itemId] = value;
  }

  return {
    confirmSync: confirmSyncText === "true",
    expectedUpdatedAtByItemId,
  };
}
