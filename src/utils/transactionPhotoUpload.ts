import { transactionAttachmentMessages } from "config/transactionAttachmentMessages";
import {
  confirmReceiptPhotoUpload,
  discardReceiptPhoto,
  requestReceiptPhotoUpload,
} from "internal/transaction/adapter/next/attachmentActions";
import { createClient } from "lib/supabase/client";
import { compressImage } from "utils/imageCompression";

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
): Promise<UploadedReceiptPhoto> {
  const full = await compressImage(file, {
    maxDimension: 1600,
    mimeType: "image/jpeg",
    quality: 0.75,
  });
  const thumbnail = await compressImage(file, {
    maxDimension: 320,
    mimeType: "image/jpeg",
    quality: 0.7,
  });

  if (full.blob.size > 2097152 || thumbnail.blob.size > 2097152) {
    throw new Error(transactionAttachmentMessages.sizeExceeded);
  }
  if (!full.blob.size || !thumbnail.blob.size) {
    throw new Error(transactionAttachmentMessages.imageDecodeFailed);
  }

  const signed = await requestReceiptPhotoUpload({
    byteSize: full.blob.size,
    height: full.height,
    width: full.width,
  });

  try {
    const storage = createClient().storage.from("transaction-attachments");
    const fullResult = await storage.uploadToSignedUrl(
      signed.full.path,
      signed.full.token,
      full.blob,
      { contentType: "image/jpeg" },
    );
    if (fullResult.error) throw new Error(transactionAttachmentMessages.uploadFailed);
    const thumbnailResult = await storage.uploadToSignedUrl(
      signed.thumbnail.path,
      signed.thumbnail.token,
      thumbnail.blob,
      { contentType: "image/jpeg" },
    );
    if (thumbnailResult.error) throw new Error(transactionAttachmentMessages.uploadFailed);
    await confirmReceiptPhotoUpload(signed.attachmentId);
    return {
      attachmentId: signed.attachmentId,
      height: full.height,
      width: full.width,
    };
  } catch (error) {
    // 即使只上传大图也要删除附件元数据；下游队列清理物理文件。
    void discardReceiptPhoto(signed.attachmentId).catch(() => {});
    throw error;
  }
}
