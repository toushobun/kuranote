import { describe, expect, it, vi } from "vitest";
import type {
  EmbeddedWorksheetPhoto,
  ImportExecutionUnit,
} from "internal/dataImport";
import { dataImportExecutionErrorMessages } from "internal/dataImport";
import { prepareImportPhotoBatch } from "./dataImportPhotoBatch";

const ids = [
  "00000000-0000-4000-8000-000000000091",
  "00000000-0000-4000-8000-000000000092",
];
const photo = (columnName: string): EmbeddedWorksheetPhoto => ({
  rowNumber: 2,
  columnName,
  mimeType: "image/jpeg",
  bytes: new Uint8Array([0xff, 0xd8, 0xff, 0xd9]),
});
const unit: ImportExecutionUnit = {
  kind: "incomeExpense",
  group: {
    rowNumbers: [2, 3],
    items: [
      { merchantName: "商家" } as never,
      { merchantName: "商家" } as never,
    ],
  },
};

describe("prepareImportPhotoBatch", () => {
  it("逐张上传并按 Excel 照片列顺序传递 ID，组内后续行不单独上传", async () => {
    const upload = vi
      .fn()
      .mockResolvedValueOnce({ attachmentId: ids[0] })
      .mockResolvedValueOnce({ attachmentId: ids[1] });
    const onPhotoUploaded = vi.fn();
    const out = await prepareImportPhotoBatch(
      [unit],
      new Map([[2, [photo("照片1"), photo("照片2")]]]),
      { ledgerId: "ledger", upload, onPhotoUploaded },
    );
    expect(upload).toHaveBeenCalledTimes(2);
    expect(onPhotoUploaded).toHaveBeenCalledTimes(2);
    expect(out.units).toEqual([
      { ...unit, group: { ...unit.group, attachmentIds: ids } },
    ]);
    expect(out.failedRows).toEqual([]);
  });

  it("PNG 图片保留正确扩展名并继续使用统一压缩上传流程", async () => {
    const upload = vi.fn().mockResolvedValue({ attachmentId: ids[0] });
    await prepareImportPhotoBatch(
      [unit],
      new Map([[2, [{ ...photo("照片1"), mimeType: "image/png" }]]]),
      { ledgerId: "ledger", upload },
    );
    const file = upload.mock.calls[0][0] as File;
    expect(file.name).toBe("receipt-2-1.png");
    expect(file.type).toBe("image/png");
  });

  it("上传失败时跳过整条记录，标记账单多行失败", async () => {
    const upload = vi
      .fn()
      .mockResolvedValueOnce({ attachmentId: ids[0] })
      .mockRejectedValueOnce(new Error("failed"));
    const onPhotoUploaded = vi.fn();
    const out = await prepareImportPhotoBatch(
      [unit],
      new Map([[2, [photo("照片1"), photo("照片2")]]]),
      { ledgerId: "ledger", upload, onPhotoUploaded },
    );
    expect(onPhotoUploaded).toHaveBeenCalledOnce();
    expect(out.units).toEqual([]);
    expect(out.failedDetails).toMatchObject([
      {
        reason: dataImportExecutionErrorMessages.photoUploadFailed,
        rowNumbers: [2, 3],
        status: "failed",
      },
    ]);
    expect(out.failedRows.map((row) => row.rowNumber)).toEqual([2, 3]);
  });

  it("没有照片时不变更导入单元、不调用上传", async () => {
    const upload = vi.fn();
    const out = await prepareImportPhotoBatch(
      [unit],
      new Map(),
      { upload },
    );
    expect(out.units).toEqual([unit]);
    expect(upload).not.toHaveBeenCalled();
  });
});
