import type { z } from "@hono/zod-openapi";
import { requireAuthenticatedUserId } from "internal/shared/auth/authContext";
import type { ControllerContext } from "internal/shared/http/controllerContext";
import {
  attachmentIdParamsSchema,
  attachmentUploadRequestSchema,
  transactionIdParamsSchema,
  transactionLedgerQuerySchema,
} from "internal/transaction/schema";

type UploadRequest = z.infer<typeof attachmentUploadRequestSchema>;
type AttachmentParams = z.infer<typeof attachmentIdParamsSchema>;
type RecordParams = z.infer<typeof transactionIdParamsSchema>;
type LedgerRequest = z.infer<typeof transactionLedgerQuerySchema>;

export const requestAttachmentUploadHandler = async (
  c: ControllerContext<{ json: UploadRequest }>,
) => {
  requireAuthenticatedUserId(c.get("requestDependencies").auth);
  const result = await c
    .get("container")
    .transaction.attachmentService.requestUpload(c.req.valid("json"));
  return c.json(result, 201);
};

export const confirmAttachmentUploadHandler = async (
  c: ControllerContext<{ json: LedgerRequest; param: AttachmentParams }>,
) => {
  requireAuthenticatedUserId(c.get("requestDependencies").auth);
  await c.get("container").transaction.attachmentService.confirmUpload({
    attachmentId: c.req.valid("param").attachmentId,
    ledgerId: c.req.valid("json").ledgerId,
  });
  return c.json({ ok: true as const }, 200);
};

export const deleteAttachmentDraftHandler = async (
  c: ControllerContext<{ param: AttachmentParams; query: LedgerRequest }>,
) => {
  requireAuthenticatedUserId(c.get("requestDependencies").auth);
  await c.get("container").transaction.attachmentService.deleteDraft({
    attachmentId: c.req.valid("param").attachmentId,
    ledgerId: c.req.valid("query").ledgerId,
  });
  return c.json({ ok: true as const }, 200);
};

export const getRecordAttachmentsHandler = async (
  c: ControllerContext<{ param: RecordParams; query: LedgerRequest }>,
) => {
  requireAuthenticatedUserId(c.get("requestDependencies").auth);
  const attachments = await c
    .get("container")
    .transaction.attachmentService.getRecordPhotos({
      ledgerId: c.req.valid("query").ledgerId,
      transactionRecordId: c.req.valid("param").transactionRecordId,
    });
  return c.json({ attachments }, 200);
};
