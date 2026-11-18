"use server";

import { createRequestContainer } from "internal/container";
import { requireCurrentUserAndLedger } from "internal/ledger/adapter/next/currentLedger";
import { createServerRequestDependencies } from "internal/shared/context/createServerRequestDependencies";

/**
 * 小票页面和未来独立识图入口共享的签名照片通道。
 * 账本从服务端当前上下文获取，浏览器不能自行指定其他账本。
 */
async function currentAttachmentService() {
  const [{ currentLedger }, dependencies] = await Promise.all([
    requireCurrentUserAndLedger(),
    createServerRequestDependencies(),
  ]);
  return {
    ledgerId: currentLedger.id,
    service: createRequestContainer(dependencies).transaction.attachmentService,
  };
}

export async function requestReceiptPhotoUpload(input: {
  byteSize: number;
  height: number;
  width: number;
}) {
  const { ledgerId, service } = await currentAttachmentService();
  return service.requestUpload({ ...input, ledgerId });
}

export async function confirmReceiptPhotoUpload(attachmentId: string) {
  const { ledgerId, service } = await currentAttachmentService();
  return service.confirmUpload({ attachmentId, ledgerId });
}

export async function discardReceiptPhoto(attachmentId: string) {
  const { ledgerId, service } = await currentAttachmentService();
  return service.deleteDraft({ attachmentId, ledgerId });
}

export async function loadReceiptPhotos(transactionRecordId: string) {
  const { ledgerId, service } = await currentAttachmentService();
  return service.getRecordPhotos({ ledgerId, transactionRecordId });
}
