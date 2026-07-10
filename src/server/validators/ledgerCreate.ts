import {
  ledgerCreateErrorCodes,
  type LedgerCreateErrorCode,
} from "server/errors/ledgerCreate";
import { isThemeColorKey, type ThemeColorKey } from "theme/themeColorTokens";
import { ledgerCurrencyOptions } from "types/ledgers";
import { getFormText } from "utils/formData";

import {
  invalid,
  parseCurrencyCode,
  parseTextField,
  type ValidationResult,
  valid,
} from "./common";

export type CreateLedgerValues = {
  baseCurrency: string;
  displayColor: ThemeColorKey;
  displayName: string;
  ledgerName: string;
};

export function validateCreateLedgerForm(
  formData: FormData,
): ValidationResult<CreateLedgerValues, LedgerCreateErrorCode> {
  const ledgerNameResult = parseTextField(formData, "ledgerName", {
    maxLength: 100,
    maxLengthError: ledgerCreateErrorCodes.nameTooLong,
    requiredError: ledgerCreateErrorCodes.nameRequired,
  });

  if (!ledgerNameResult.ok) {
    return ledgerNameResult;
  }

  const currencyResult = parseCurrencyCode(
    getFormText(formData, "baseCurrency"),
    ledgerCreateErrorCodes.currencyInvalid,
  );

  if (!currencyResult.ok) {
    return currencyResult;
  }

  if (
    !ledgerCurrencyOptions.some(
      (currency) => currency.value === currencyResult.value,
    )
  ) {
    return invalid(ledgerCreateErrorCodes.currencyInvalid);
  }

  const displayNameResult = parseTextField(formData, "memberDisplayName", {
    maxLength: 100,
    maxLengthError: ledgerCreateErrorCodes.displayNameTooLong,
    requiredError: ledgerCreateErrorCodes.displayNameRequired,
  });

  if (!displayNameResult.ok) {
    return displayNameResult;
  }

  const displayColor = getFormText(formData, "memberDisplayColor").trim();

  if (!isThemeColorKey(displayColor)) {
    return invalid(ledgerCreateErrorCodes.displayColorInvalid);
  }

  return valid({
    baseCurrency: currencyResult.value,
    displayColor,
    displayName: displayNameResult.value,
    ledgerName: ledgerNameResult.value,
  });
}
