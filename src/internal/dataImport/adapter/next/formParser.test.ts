import { describe, expect, it } from "vitest";

import {
  parseCheckDataImportFileForm,
  parseExecuteDataImportBatchForm,
} from "internal/dataImport/adapter/next/formParser";
import { dataImportErrorCodes } from "internal/dataImport/errors";

function buildFormData(
  file: File | null,
  offset?: string,
  timeZoneOffsetMinutes?: string,
) {
  const formData = new FormData();
  if (file) {
    formData.set("file", file);
  }
  if (offset !== undefined) {
    formData.set("offset", offset);
  }
  if (timeZoneOffsetMinutes !== undefined) {
    formData.set("timeZoneOffsetMinutes", timeZoneOffsetMinutes);
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
    const file = new File([], "empty.xlsx");
    const result = parseCheckDataImportFileForm(buildFormData(file));
    expect(result).toEqual({
      error: dataImportErrorCodes.fileRequired,
      ok: false,
    });
  });

  it("不支持的扩展名（包括 csv）返回 fileTypeUnsupported", () => {
    const file = new File(["a,b"], "data.csv", { type: "text/csv" });
    const result = parseCheckDataImportFileForm(buildFormData(file));
    expect(result).toEqual({
      error: dataImportErrorCodes.fileTypeUnsupported,
      ok: false,
    });
  });

  it("超过 10MB 时返回 fileTooLarge", () => {
    const file = new File([new Uint8Array(10 * 1024 * 1024 + 1)], "big.xlsx");
    const result = parseCheckDataImportFileForm(buildFormData(file));
    expect(result).toEqual({
      error: dataImportErrorCodes.fileTooLarge,
      ok: false,
    });
  });

  it("合法 xlsx 文件（大小写不敏感）解析成功", () => {
    const file = new File(["binary"], "DATA.XLSX");
    const result = parseCheckDataImportFileForm(buildFormData(file));
    expect(result.ok).toBe(true);
  });
});

describe("parseExecuteDataImportBatchForm", () => {
  it("合法文件、非负整数 offset 与时区偏移解析成功", () => {
    const file = new File(["binary"], "data.xlsx");
    const result = parseExecuteDataImportBatchForm(
      buildFormData(file, "25", "-540"),
    );

    expect(result).toEqual({
      ok: true,
      value: { file, offset: 25, timeZoneOffsetMinutes: -540 },
    });
  });

  it("offset 缺失、负数或小数时返回 executionInvalid", () => {
    const file = new File(["binary"], "data.xlsx");

    for (const offset of [undefined, "-1", "1.5", "abc"]) {
      const result = parseExecuteDataImportBatchForm(
        buildFormData(file, offset, "-540"),
      );
      expect(result).toEqual({
        error: dataImportErrorCodes.executionInvalid,
        ok: false,
      });
    }
  });

  it("时区偏移缺失、越界或非整数时返回 executionInvalid", () => {
    const file = new File(["binary"], "data.xlsx");

    for (const timeZoneOffsetMinutes of [undefined, "-841", "841", "1.5", "abc"]) {
      const result = parseExecuteDataImportBatchForm(
        buildFormData(file, "0", timeZoneOffsetMinutes),
      );
      expect(result).toEqual({
        error: dataImportErrorCodes.executionInvalid,
        ok: false,
      });
    }
  });
});
