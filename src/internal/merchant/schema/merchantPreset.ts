import { z } from "zod";

export const merchantPresetInputSchema = z
  .object({
    currency: z.string().min(1).max(3),
    templateVersion: z.number().int().positive(),
    selectedKeys: z.array(z.string().min(1).max(100)).min(1).max(300),
  })
  .strict();

export type MerchantPresetInput = z.infer<typeof merchantPresetInputSchema>;

export function parseMerchantPresetForm(
  formData: FormData,
): MerchantPresetInput | null {
  const version = formData.get("templateVersion");
  const parsed = merchantPresetInputSchema.safeParse({
    currency: formData.get("currency"),
    templateVersion:
      typeof version === "string" && version.trim()
        ? Number(version)
        : undefined,
    selectedKeys: formData.getAll("selectedKeys"),
  });
  return parsed.success ? parsed.data : null;
}
