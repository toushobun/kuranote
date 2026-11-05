import { z } from "zod";
import { ledgerSetupRegions, ledgerSetupLimits } from "internal/ledger";

export const merchantPresetInputSchema = z
  .object({
    regions: z.array(z.enum(ledgerSetupRegions)).min(1).max(2),
    templateVersion: z.number().int().positive(),
    selectedKeys: z
      .array(z.string().min(1).max(100))
      .min(1)
      .max(ledgerSetupLimits.maxMerchants),
  })
  .strict();

export type MerchantPresetInput = z.infer<typeof merchantPresetInputSchema>;

export function parseMerchantPresetForm(
  formData: FormData,
): MerchantPresetInput | null {
  const version = formData.get("templateVersion");
  const parsed = merchantPresetInputSchema.safeParse({
    regions: formData.getAll("regions"),
    templateVersion:
      typeof version === "string" && version.trim()
        ? Number(version)
        : undefined,
    selectedKeys: formData.getAll("selectedKeys"),
  });
  return parsed.success ? parsed.data : null;
}
