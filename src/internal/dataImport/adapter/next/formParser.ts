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
const acceptedExtensions = [".csv", ".xlsx"];

export type DataImportFormFields = {
  file: File;
};

function hasAcceptedExtension(fileName: string) {
  const lowerName = fileName.toLowerCase();
  return acceptedExtensions.some((extension) => lowerName.endsWith(extension));
}

export function parseCheckDataImportFileForm(
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
