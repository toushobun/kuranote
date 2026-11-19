import { transactionAttachmentLimits } from "config/transactionAttachmentLimits";
import { transactionAttachmentMessages } from "config/transactionAttachmentMessages";
import { createClient } from "lib/supabase/client";
import { compressImage } from "utils/imageCompression";
import {
  confirmReceiptPhotoUpload,
  discardReceiptPhoto,
  requestReceiptPhotoUpload,
} from "./transactionAttachmentClient";

export type UploadedReceiptPhoto = {
  attachmentId: string;
  width: number;
  height: number;
};

/**
 * 小票画面无关的上传步骤：选照片 → 去 EXIF / JPEG 双尺寸压缩 → 申请签名 → 上传 → 确认。
 * 未来识图入口可直接复用，不依赖记账表单或图片列表组件。
 */
export async function uploadReceiptPhoto(
  file: File,
  ledgerId: string,
): Promise<UploadedReceiptPhoto> {
  const full = await compressReceiptPhoto(file, 1600, 0.75);
  const thumbnail = await compressReceiptPhoto(full.blob, 320, 0.7);

  if (
    full.blob.size > transactionAttachmentLimits.maxBytes ||
    thumbnail.blob.size > transactionAttachmentLimits.maxBytes
  ) {
    throw new Error(transactionAttachmentMessages.sizeExceeded);
  }
  if (!full.blob.size || !thumbnail.blob.size) {
    throw new Error(transactionAttachmentMessages.imageDecodeFailed);
  }

  const signed = await requestReceiptPhotoUpload({
    byteSize: full.blob.size,
    height: full.height,
    ledgerId,
    width: full.width,
  });

  try {
    await uploadSignedPhotos([
      { ...signed.full, blob: full.blob },
      { ...signed.thumbnail, blob: thumbnail.blob },
    ]);
    await confirmReceiptPhotoUpload(ledgerId, signed.attachmentId);
    return {
      attachmentId: signed.attachmentId,
      height: full.height,
      width: full.width,
    };
  } catch (error) {
    // 即使只上传大图也要删除附件元数据；下游队列清理物理文件。
    void discardReceiptPhoto(ledgerId, signed.attachmentId).catch(() => {});
    throw error;
  }
}

async function uploadSignedPhotos(
  targets: { path: string; token: string; blob: Blob }[],
) {
  try {
    const storage = createClient().storage.from("transaction-attachments");
    for (const { blob, path, token } of targets) {
      const { error } = await storage.uploadToSignedUrl(path, token, blob, {
        contentType: "image/jpeg",
      });
      if (error) throw error;
    }
  } catch {
    throw new Error(transactionAttachmentMessages.uploadFailed);
  }
}

/** 浏览器不支持 HEIC 等格式或编码失败时，统一返回可理解的提示。 */
async function compressReceiptPhoto(
  file: Blob,
  maxDimension: number,
  quality: number,
) {
  try {
    return await compressImage(file, {
      maxDimension,
      mimeType: "image/jpeg",
      quality,
    });
  } catch {
    throw new Error(transactionAttachmentMessages.imageDecodeFailed);
  }
}
