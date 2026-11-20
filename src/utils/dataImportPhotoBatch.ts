import type {
  ImportExecutionDetail,
  ImportExecutionRowResult,
  ImportExecutionUnit,
  EmbeddedWorksheetPhoto,
} from "internal/dataImport";
import { dataImportExecutionErrorMessages } from "internal/dataImport";
import { uploadReceiptPhoto } from "utils/transactionPhotoUpload";

export async function prepareImportPhotoBatch(
  units: ImportExecutionUnit[],
  photosByRow: Map<number, EmbeddedWorksheetPhoto[]>,
  ledgerId?: string,
  upload = uploadReceiptPhoto,
  onPhotoUploaded?: () => void,
): Promise<{
  units: ImportExecutionUnit[];
  failedRows: ImportExecutionRowResult[];
  failedDetails: ImportExecutionDetail[];
}> {
  const prepared: ImportExecutionUnit[] = [];
  const failedRows: ImportExecutionRowResult[] = [];
  const failedDetails: ImportExecutionDetail[] = [];

  for (const unit of units) {
    if (unit.kind !== "incomeExpense") {
      prepared.push(unit);
      continue;
    }
    const rowNumbers = unit.group.rowNumbers;
    const photos = photosByRow.get(rowNumbers[0]) ?? [];
    if (photos.length === 0) {
      prepared.push(unit);
      continue;
    }
    try {
      if (!ledgerId) throw new Error("Missing ledger");
      const attachmentIds: string[] = [];
      for (const [index, photo] of photos.entries()) {
        const file = new File(
          [new Uint8Array(photo.bytes)],
          `receipt-${rowNumbers[0]}-${index + 1}.${photo.mimeType === "image/png" ? "png" : "jpg"}`,
          { type: photo.mimeType },
        );
        const uploaded = await upload(file, ledgerId);
        attachmentIds.push(uploaded.attachmentId);
        onPhotoUploaded?.();
      }
      prepared.push({
        ...unit,
        group: { ...unit.group, attachmentIds },
      });
    } catch {
      // 一张照片失败就跳过整笔账单，已上传的草稿由现有定时清理任务回收。
      const reason = dataImportExecutionErrorMessages.photoUploadFailed;
      for (const rowNumber of rowNumbers) {
        failedRows.push({
          reason,
          rowNumber,
          sheet: "incomeExpense",
          status: "failed",
        });
      }
      failedDetails.push({
        content: unit.group.items[0].merchantName,
        reason,
        rowNumbers,
        sheet: "incomeExpense",
        status: "failed",
      });
    }
  }
  return { units: prepared, failedRows, failedDetails };
}
