// 与 20261118100000_create_transaction_attachments.sql 中的限制保持一致。
export const transactionAttachmentLimits = {
  maxBytes: 2_097_152,
  maxCount: 5,
} as const;
