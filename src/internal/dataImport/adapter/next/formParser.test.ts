import { describe, expect, it } from "vitest";

import { dataImportErrorCodes } from "internal/dataImport/errors";
import { parseCheckDataImportFileForm } from "internal/dataImport/adapter/next/formParser";

function buildFormData(file: File | null) {
  const formData = new FormData();
  if (file) {
    formData.set("file", file);
  }
  return formData;
}

describe("parseCheckDataImportFileForm", () => {
  it("未选择文件时返回 fileRequired", () => {
    const result = parseCheckDataImportFileForm(buildFormData(null));
    expect(result).toEqual({
      error: dataImportErrorCodes.fileRequired,
      ok: false,
    });
  });

  it("空文件（0 字节）视为未选择文件", () => {
    const file = new File([], "empty.csv", { type: "text/csv" });
    const result = parseCheckDataImportFileForm(buildFormData(file));
    expect(result).toEqual({
      error: dataImportErrorCodes.fileRequired,
      ok: false,
    });
  });

  it("不支持的扩展名返回 fileTypeUnsupported", () => {
    const file = new File(["a,b"], "data.txt", { type: "text/plain" });
    const result = parseCheckDataImportFileForm(buildFormData(file));
    expect(result).toEqual({
      error: dataImportErrorCodes.fileTypeUnsupported,
      ok: false,
    });
  });

  it("超过 10MB 时返回 fileTooLarge", () => {
    const file = new File([new Uint8Array(10 * 1024 * 1024 + 1)], "big.csv", {
      type: "text/csv",
    });
    const result = parseCheckDataImportFileForm(buildFormData(file));
    expect(result).toEqual({
      error: dataImportErrorCodes.fileTooLarge,
      ok: false,
    });
  });

  it("合法 csv 文件解析成功", () => {
    const file = new File(["a,b"], "data.csv", { type: "text/csv" });
    const result = parseCheckDataImportFileForm(buildFormData(file));
    expect(result).toEqual({ ok: true, value: { file } });
  });

  it("合法 xlsx 文件（大小写不敏感）解析成功", () => {
    const file = new File(["binary"], "DATA.XLSX");
    const result = parseCheckDataImportFileForm(buildFormData(file));
    expect(result.ok).toBe(true);
  });
});
