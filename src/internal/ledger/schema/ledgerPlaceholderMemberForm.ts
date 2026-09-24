import { ledgerPlaceholderMemberNameMaxLength } from "internal/ledger/entity/ledgerPlaceholderMember";
import {
  ledgerPlaceholderMemberErrorCodes,
  type LedgerPlaceholderMemberErrorCode,
} from "internal/ledger/errors/ledgerPlaceholderMember";
import {
  parseRequiredUuidField,
  parseTextField,
  type ValidationResult,
  valid,
} from "internal/shared/schema/formValidation";

type ParseResult<T> = ValidationResult<T, LedgerPlaceholderMemberErrorCode>;

export type RenameLedgerPlaceholderMemberFormValues = {
  displayName: string;
  ledgerId: string;
  placeholderId: string;
};

export type DeleteLedgerPlaceholderMemberFormValues = {
  ledgerId: string;
  placeholderId: string;
};

function parseLedgerId(formData: FormData): ParseResult<string> {
  return parseRequiredUuidField(
    formData,
    "ledgerId",
    ledgerPlaceholderMemberErrorCodes.ledgerNotFound,
  );
}

function parsePlaceholderId(formData: FormData): ParseResult<string> {
  return parseRequiredUuidField(
    formData,
    "placeholderId",
    ledgerPlaceholderMemberErrorCodes.placeholderNotFound,
  );
}

function parseDisplayName(formData: FormData): ParseResult<string> {
  return parseTextField(formData, "displayName", {
    maxLength: ledgerPlaceholderMemberNameMaxLength,
    maxLengthError: ledgerPlaceholderMemberErrorCodes.placeholderNameTooLong,
    requiredError: ledgerPlaceholderMemberErrorCodes.placeholderNameInvalid,
  });
}

export function parseRenameLedgerPlaceholderMemberForm(
  formData: FormData,
): ParseResult<RenameLedgerPlaceholderMemberFormValues> {
  const target = parseDeleteLedgerPlaceholderMemberForm(formData);
  if (!target.ok) return target;
  const displayName = parseDisplayName(formData);
  if (!displayName.ok) return displayName;

  return valid({ ...target.value, displayName: displayName.value });
}

export function parseDeleteLedgerPlaceholderMemberForm(
  formData: FormData,
): ParseResult<DeleteLedgerPlaceholderMemberFormValues> {
  const ledgerId = parseLedgerId(formData);
  if (!ledgerId.ok) return ledgerId;
  const placeholderId = parsePlaceholderId(formData);
  if (!placeholderId.ok) return placeholderId;

  return valid({
    ledgerId: ledgerId.value,
    placeholderId: placeholderId.value,
  });
}
