import { transactionAttachmentMessages as m } from "config/transactionAttachmentMessages";
import {
  attachmentSignedReadResponseSchema,
  attachmentUploadResponseSchema,
} from "config/transactionAttachmentResponses";
import { executeClientMutation } from "lib/api/clientMutation";
import { executeClientJsonRequest } from "lib/api/clientQuery";

const transactionsUrl = "/api/transactions";
const attachmentsUrl = `${transactionsUrl}/attachments`;

export function requestReceiptPhotoUpload(input: {
  byteSize: number;
  height: number;
  ledgerId: string;
  width: number;
}) {
  return executeClientJsonRequest({
    errorMessage: m.uploadFailed,
    init: jsonPost(input),
    parse: (body) => attachmentUploadResponseSchema.safeParse(body).data,
    url: `${attachmentsUrl}/upload-requests`,
  });
}

export async function confirmReceiptPhotoUpload(
  ledgerId: string,
  attachmentId: string,
) {
  await mutateAttachment(
    `${attachmentsUrl}/${encodeURIComponent(attachmentId)}/confirm`,
    jsonPost({ ledgerId }),
    m.confirmFailed,
  );
}

export async function discardReceiptPhoto(
  ledgerId: string,
  attachmentId: string,
) {
  await mutateAttachment(
    `${attachmentsUrl}/${encodeURIComponent(attachmentId)}?${ledgerQuery(ledgerId)}`,
    { method: "DELETE" },
    m.deleteFailed,
  );
}

export function loadReceiptPhotos(ledgerId: string, recordId: string) {
  return executeClientJsonRequest({
    errorMessage: m.loadFailed,
    init: { headers: { accept: "application/json" } },
    parse: (body) =>
      attachmentSignedReadResponseSchema.safeParse(body).data?.attachments,
    url: `${transactionsUrl}/${encodeURIComponent(recordId)}/attachments?${ledgerQuery(ledgerId)}`,
  });
}

function ledgerQuery(ledgerId: string) {
  return new URLSearchParams({ ledgerId }).toString();
}

function jsonPost(body: object): RequestInit {
  return {
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json", accept: "application/json" },
    method: "POST",
  };
}

async function mutateAttachment(
  url: string,
  init: RequestInit,
  errorMessage: string,
) {
  const result = await executeClientMutation({
    fallbackErrorMessage: errorMessage,
    init,
    networkErrorMessage: errorMessage,
    url,
  });
  if (!result.ok) throw new Error(result.errorMessage);
}
