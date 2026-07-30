import type { CurrentLedgerRole } from "internal/ledger/entity/currentLedger";
import {
  ledgerSettingsErrorCodes,
  type LedgerSettingsErrorCode,
} from "internal/ledger/errors/ledgerSettings";
import { isThemeColorKey, type ThemeColorKey } from "theme/themeColorTokens";
import { getFormText } from "utils/formData";

import {
  invalid,
  parseCurrencyCode,
  parseRequiredUuidField,
  parseTextField,
  type ValidationResult,
  valid,
} from "internal/shared/schema/formValidation";

const ledgerSettingsIntentValues = ["ledger", "member"] as const;

type LedgerSettingsIntent = (typeof ledgerSettingsIntentValues)[number];

export type UpdateLedgerMemberSettingsValues = {
  displayColor: ThemeColorKey;
  displayName: string;
  role: CurrentLedgerRole;
  userId: string;
};

export type UpdateLedgerBaseSettingsValues = {
  baseCurrency: string;
  ledgerName: string;
};

export type UpdateLedgerSettingsValues = {
  intent: LedgerSettingsIntent;
  ledgerId: string;
  ledgerSettings: UpdateLedgerBaseSettingsValues | null;
  memberSettings: UpdateLedgerMemberSettingsValues | null;
};

function parseDisplayColor(
  formData: FormData,
  fieldName: string,
): ValidationResult<
  ThemeColorKey,
  typeof ledgerSettingsErrorCodes.displayColorInvalid
> {
  const displayColor = getFormText(formData, fieldName).trim();

  return isThemeColorKey(displayColor)
    ? valid(displayColor)
    : invalid(ledgerSettingsErrorCodes.displayColorInvalid);
}

function parseMemberRole(
  role: string,
): ValidationResult<
  CurrentLedgerRole,
  typeof ledgerSettingsErrorCodes.roleInvalid
> {
  if (
    role === "owner" ||
    role === "admin" ||
    role === "member" ||
    role === "viewer"
  ) {
    return valid(role);
  }

  return invalid(ledgerSettingsErrorCodes.roleInvalid);
}

function parseLedgerSettingsIntent(
  formData: FormData,
): ValidationResult<
  LedgerSettingsIntent,
  typeof ledgerSettingsErrorCodes.updateFailed
> {
  const intent = getFormText(formData, "intent").trim();

  return (ledgerSettingsIntentValues as readonly string[]).includes(intent)
    ? valid(intent as LedgerSettingsIntent)
    : invalid(ledgerSettingsErrorCodes.updateFailed);
}

function validateLedgerBaseSettingsForm(
  formData: FormData,
): ValidationResult<UpdateLedgerBaseSettingsValues, LedgerSettingsErrorCode> {
  const ledgerNameResult = parseTextField(formData, "ledgerName", {
    maxLength: 100,
    maxLengthError: ledgerSettingsErrorCodes.nameTooLong,
    requiredError: ledgerSettingsErrorCodes.nameRequired,
  });

  if (!ledgerNameResult.ok) {
    return ledgerNameResult;
  }

  const currencyResult = parseCurrencyCode(
    getFormText(formData, "baseCurrency"),
    ledgerSettingsErrorCodes.currencyInvalid,
  );

  if (!currencyResult.ok) {
    return currencyResult;
  }

  return valid({
    baseCurrency: currencyResult.value,
    ledgerName: ledgerNameResult.value,
  });
}

function validateMemberSettingsForm(
  formData: FormData,
): ValidationResult<UpdateLedgerMemberSettingsValues, LedgerSettingsErrorCode> {
  const memberUserIdResult = parseRequiredUuidField(
    formData,
    "memberUserId",
    ledgerSettingsErrorCodes.memberInvalid,
  );

  if (!memberUserIdResult.ok) {
    return memberUserIdResult;
  }

  const displayNameResult = parseTextField(formData, "memberDisplayName", {
    maxLength: 100,
    maxLengthError: ledgerSettingsErrorCodes.displayNameTooLong,
    requiredError: ledgerSettingsErrorCodes.displayNameRequired,
  });

  if (!displayNameResult.ok) {
    return displayNameResult;
  }

  const displayColorResult = parseDisplayColor(formData, "memberDisplayColor");

  if (!displayColorResult.ok) {
    return displayColorResult;
  }

  const roleResult = parseMemberRole(getFormText(formData, "memberRole"));

  if (!roleResult.ok) {
    return roleResult;
  }

  return valid({
    displayColor: displayColorResult.value,
    displayName: displayNameResult.value,
    role: roleResult.value,
    userId: memberUserIdResult.value,
  });
}

export function validateUpdateLedgerSettingsForm(
  formData: FormData,
): ValidationResult<UpdateLedgerSettingsValues, LedgerSettingsErrorCode> {
  const ledgerIdResult = parseRequiredUuidField(
    formData,
    "ledgerId",
    ledgerSettingsErrorCodes.ledgerInvalid,
  );

  if (!ledgerIdResult.ok) {
    return ledgerIdResult;
  }

  const intentResult = parseLedgerSettingsIntent(formData);

  if (!intentResult.ok) {
    return intentResult;
  }

  if (intentResult.value === "ledger") {
    const ledgerSettingsResult = validateLedgerBaseSettingsForm(formData);

    if (!ledgerSettingsResult.ok) {
      return ledgerSettingsResult;
    }

    return valid({
      intent: "ledger",
      ledgerId: ledgerIdResult.value,
      ledgerSettings: ledgerSettingsResult.value,
      memberSettings: null,
    });
  }

  const memberSettingsResult = validateMemberSettingsForm(formData);

  if (!memberSettingsResult.ok) {
    return memberSettingsResult;
  }

  return valid({
    intent: "member",
    ledgerId: ledgerIdResult.value,
    ledgerSettings: null,
    memberSettings: memberSettingsResult.value,
  });
}
