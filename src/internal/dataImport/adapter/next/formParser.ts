import {
  dataImportErrorCodes,
  type DataImportErrorCode,
} from "internal/dataImport/errors";
import {
  invalid,
  valid,
  type ValidationResult,
} from "internal/shared/schema/formValidation";

const maxFileSizeBytes = 10 * 1024 * 1024;
const acceptedExtensions = [".xlsx"];

export type DataImportFormFields = {
  file: File;
};

export type DataImportBatchFormFields = DataImportFormFields & {
  offset: number;
};

function hasAcceptedExtension(fileName: string) {
  const lowerName = fileName.toLowerCase();
  return acceptedExtensions.some((extension) => lowerName.endsWith(extension));
}

function parseDataImportFile(
  formData: FormData,
): ValidationResult<DataImportFormFields, DataImportErrorCode> {
  const value = formData.get("file");

  if (!(value instanceof File) || value.size === 0) {
    return invalid(dataImportErrorCodes.fileRequired);
  }

  if (!hasAcceptedExtension(value.name)) {
    return invalid(dataImportErrorCodes.fileTypeUnsupported);
  }

  if (value.size > maxFileSizeBytes) {
    return invalid(dataImportErrorCodes.fileTooLarge);
  }

  return valid({ file: value });
}

export function parseCheckDataImportFileForm(
  formData: FormData,
): ValidationResult<DataImportFormFields, DataImportErrorCode> {
  return parseDataImportFile(formData);
}

export function parseExecuteDataImportBatchForm(
  formData: FormData,
): ValidationResult<DataImportBatchFormFields, DataImportErrorCode> {
  const fileResult = parseDataImportFile(formData);
  if (!fileResult.ok) return fileResult;

  const offsetText = formData.get("offset");
  const offset = typeof offsetText === "string" ? Number(offsetText) : NaN;
  if (!Number.isInteger(offset) || offset < 0) {
    return invalid(dataImportErrorCodes.executionInvalid);
  }

  return valid({ file: fileResult.value.file, offset });
}
