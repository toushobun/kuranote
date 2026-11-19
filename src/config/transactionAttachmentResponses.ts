import { z } from "zod";

const uploadTokenSchema = z.object({
  path: z.string(),
  signedUrl: z.string().url(),
  token: z.string(),
});

export const attachmentUploadResponseSchema = z.object({
  attachmentId: z.string().uuid(),
  full: uploadTokenSchema,
  thumbnail: uploadTokenSchema,
});

export const attachmentSignedReadResponseSchema = z.object({
  attachments: z.array(
    z.object({
      id: z.string().uuid(),
      fullUrl: z.string().url(),
      thumbnailUrl: z.string().url(),
    }),
  ),
});
