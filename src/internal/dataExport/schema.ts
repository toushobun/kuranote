import { z } from "zod";

export const dataExportOptionsSchema = z
  .object({
    recordTypes: z
      .array(z.enum(["normal", "transfer", "balance_adjustment"]))
      .min(1)
      .max(3),
    dateStart: z.iso.datetime({ offset: true }).optional(),
    dateEnd: z.iso.datetime({ offset: true }).optional(),
    includePhotos: z.boolean().optional(),
  })
  .refine(
    ({ dateStart, dateEnd }) =>
      !dateStart || !dateEnd || Date.parse(dateStart) < Date.parse(dateEnd),
  );

export type DataExportOptions = z.infer<typeof dataExportOptionsSchema>;
