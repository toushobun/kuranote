import { accountErrorCodes } from "internal/account/errors";
import { accountTypeOptions, type AccountType } from "types/accounts";
import { getFormText, isUuid } from "utils/formData";

export type AccountFormParseResult<T> =
  | { ok: true; value: T }
  | { error: string; ok: false };

type AccountFormFields = {
  currency: string;
  holderUserIds: string[];
  name: string;
  type: AccountType;
};

export type CreateAccountFormValues = AccountFormFields & {
  initialBalance: number;
};

export type UpdateAccountFormValues = AccountFormFields & {
  accountId: string;
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
  const accountType = accountTypeOptions.find(
    (option) => option.value === type,
  )?.value;
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
  if (
    holderUserIds.length === 0 ||
    holderUserIds.some((userId) => !isUuid(userId))
  ) {
    return invalid(accountErrorCodes.holderInvalid);
  }

  return {
    ok: true,
    value: { currency, holderUserIds, name, type: accountType },
  };
}

export function parseCreateAccountForm(
  formData: FormData,
): AccountFormParseResult<CreateAccountFormValues> {
  const fields = parseAccountFields(formData);
  if (!fields.ok) return fields;

  const balanceText = String(formData.get("initialBalance") ?? "").trim();
  const normalizedBalance = balanceText || "0";
  if (!/^-?\d+(\.\d{1,2})?$/.test(normalizedBalance)) {
    return invalid(accountErrorCodes.initialBalanceInvalid);
  }

  const initialBalance = Number(normalizedBalance);
  if (!Number.isFinite(initialBalance)) {
    return invalid(accountErrorCodes.initialBalanceInvalid);
  }

  return { ok: true, value: { ...fields.value, initialBalance } };
}

export function parseUpdateAccountForm(
  formData: FormData,
): AccountFormParseResult<UpdateAccountFormValues> {
  const accountId = getFormText(formData, "accountId").trim();
  if (!isUuid(accountId)) return invalid(accountErrorCodes.accountInvalid);

  const fields = parseAccountFields(formData);
  if (!fields.ok) return fields;

  return { ok: true, value: { ...fields.value, accountId } };
}

export function parseArchiveAccountForm(
  formData: FormData,
): AccountFormParseResult<{ accountId: string }> {
  const accountId = getFormText(formData, "accountId").trim();
  return isUuid(accountId)
    ? { ok: true, value: { accountId } }
    : invalid(accountErrorCodes.accountInvalid);
}
