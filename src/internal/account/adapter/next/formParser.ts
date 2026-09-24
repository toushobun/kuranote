import { isAccountBalanceText } from "internal/account/util/accountBalance";
import { accountErrorCodes } from "internal/account/errors";
import {
  accountBalanceAdjustmentSchema,
  getAccountBalanceAdjustmentErrorCode,
} from "internal/account/schema";
import {
  accountTypes,
  type AccountType,
} from "internal/account/entity/accountType";
import { getFormText, isUuid } from "utils/formData";

export type AccountFormParseResult<T> =
  | { ok: true; value: T }
  | { error: string; ok: false };

type AccountFormFields = {
  currency: string;
  holderPlaceholderId: string | null;
  holderUserIds: string[];
  name: string;
  type: AccountType;
};

export type CreateAccountFormValues = AccountFormFields & {
  initialBalance: number;
};

export type UpdateAccountFormValues = AccountFormFields & {
  accountId: string;
  targetBalance?: number;
  balanceAdjustmentNote?: string | null;
};

function invalid(error: string): AccountFormParseResult<never> {
  return { error, ok: false };
}

function parseAccountFields(
  formData: FormData,
): AccountFormParseResult<AccountFormFields> {
  const name = getFormText(formData, "name").trim();
  if (!name) return invalid(accountErrorCodes.nameRequired);

  const type = getFormText(formData, "type").trim();
  const accountType = accountTypes.find((accountType) => accountType === type);
  if (!accountType) return invalid(accountErrorCodes.typeInvalid);

  const currency = getFormText(formData, "currency").trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(currency)) {
    return invalid(accountErrorCodes.currencyInvalid);
  }

  const holderUserIds = [
    ...new Set(
      formData
        .getAll("holderUserIds")
        .map((value) => String(value).trim())
        .filter(Boolean),
    ),
  ];
  if (holderUserIds.some((userId) => !isUuid(userId))) {
    return invalid(accountErrorCodes.holderInvalid);
  }
  if (holderUserIds.length > 1) {
    return invalid(accountErrorCodes.holderTooMany);
  }

  // 占位持有人与真实成员持有人互斥，两者都为空表示无持有人。
  const holderPlaceholderId =
    getFormText(formData, "holderPlaceholderId") || null;
  if (holderPlaceholderId !== null && !isUuid(holderPlaceholderId)) {
    return invalid(accountErrorCodes.holderInvalid);
  }
  if (holderPlaceholderId !== null && holderUserIds.length > 0) {
    return invalid(accountErrorCodes.holderIdentityInvalid);
  }

  return {
    ok: true,
    value: {
      currency,
      holderPlaceholderId,
      holderUserIds,
      name,
      type: accountType,
    },
  };
}

export function parseCreateAccountForm(
  formData: FormData,
): AccountFormParseResult<CreateAccountFormValues> {
  const fields = parseAccountFields(formData);
  if (!fields.ok) return fields;

  const balanceText = String(formData.get("initialBalance") ?? "").trim();
  const normalizedBalance = balanceText || "0";
  if (!isAccountBalanceText(normalizedBalance)) {
    return invalid(accountErrorCodes.initialBalanceInvalid);
  }

  const initialBalance = Number(normalizedBalance);

  return { ok: true, value: { ...fields.value, initialBalance } };
}

export function parseUpdateAccountForm(
  formData: FormData,
): AccountFormParseResult<UpdateAccountFormValues> {
  const accountId = getFormText(formData, "accountId").trim();
  if (!isUuid(accountId)) return invalid(accountErrorCodes.accountInvalid);

  const fields = parseAccountFields(formData);
  if (!fields.ok) return fields;

  const balanceText = getFormText(formData, "targetBalance").trim();
  if (formData.has("targetBalance") && !isAccountBalanceText(balanceText)) {
    return invalid(accountErrorCodes.balanceInvalid);
  }
  const adjustment = accountBalanceAdjustmentSchema.safeParse({
    ...(formData.has("targetBalance")
      ? { targetBalance: Number(balanceText) }
      : {}),
    ...(formData.has("balanceAdjustmentNote")
      ? {
          balanceAdjustmentNote: getFormText(formData, "balanceAdjustmentNote"),
        }
      : {}),
  });
  if (!adjustment.success) {
    return invalid(getAccountBalanceAdjustmentErrorCode(adjustment.error));
  }
  return {
    ok: true,
    value: { ...fields.value, accountId, ...adjustment.data },
  };
}

export function parseArchiveAccountForm(
  formData: FormData,
): AccountFormParseResult<{ accountId: string }> {
  const accountId = getFormText(formData, "accountId").trim();
  return isUuid(accountId)
    ? { ok: true, value: { accountId } }
    : invalid(accountErrorCodes.accountInvalid);
}
