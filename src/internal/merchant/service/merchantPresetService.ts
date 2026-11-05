import {
  buildLedgerSetupMerchantPayload,
  type LedgerSetupService,
} from "internal/ledger";
import type { MerchantPresetOptions } from "internal/merchant/entity/merchantPresetOptions";
import {
  merchantErrorCodes,
  merchantErrorMessages,
} from "internal/merchant/errors";
import type { MerchantPresetRepository } from "internal/merchant/repository/merchantPresetRepository";
import {
  merchantPresetInputSchema,
  type MerchantPresetInput,
} from "internal/merchant/schema/merchantPreset";
import type { MerchantService } from "internal/merchant/service/merchantService";
import { ValidationError } from "internal/shared/errors/appError";
import {
  buildMerchantChecklist,
  getAddedMerchantPresetKeys,
} from "utils/merchantPresets";

export interface MerchantPresetService {
  load(ledgerId: string): Promise<MerchantPresetOptions>;
  add(ledgerId: string, input: MerchantPresetInput): Promise<number>;
}

export function createMerchantPresetService({
  merchantService,
  repository,
  templateService,
}: {
  merchantService: Pick<MerchantService, "assertCanManage">;
  repository: MerchantPresetRepository;
  templateService: Pick<LedgerSetupService, "getTemplate">;
}): MerchantPresetService {
  async function loadContext(ledgerId: string) {
    await merchantService.assertCanManage({ ledgerId });
    const region = await repository.getRegion(ledgerId);
    const template = templateService.getTemplate(region ?? "jp")!;
    const existing = await repository.listExistingNames(ledgerId);
    const addedKeys = template
      ? getAddedMerchantPresetKeys(
          template,
          [...existing.names, ...existing.aliases],
          existing.names,
        )
      : [];
    return { region, template, addedKeys };
  }
  return {
    async load(ledgerId) {
      const { region, template, addedKeys } = await loadContext(ledgerId);
      return {
        region,
        templateVersion: template?.version ?? null,
        ...(template
          ? buildMerchantChecklist(template)
          : { groups: [], items: [] }),
        addedKeys,
      };
    },
    async add(ledgerId, input) {
      const options = await loadContext(ledgerId);
      const parsed = merchantPresetInputSchema.safeParse(input);
      const { template } = options;
      if (
        !parsed.success ||
        !template ||
        parsed.data.templateVersion !== template.version ||
        parsed.data.selectedKeys.some(
          (key) =>
            !template.merchants.some(
              (merchant) =>
                merchant.key === key &&
                merchant.regions.some((region) =>
                  parsed.data.regions.includes(region),
                ),
            ),
        )
      ) {
        throw new ValidationError(
          merchantErrorCodes.merchantPresetInvalid,
          merchantErrorMessages[merchantErrorCodes.merchantPresetInvalid],
        );
      }
      const added = new Set(options.addedKeys);
      const keys = [...new Set(parsed.data.selectedKeys)].filter(
        (key) => !added.has(key),
      );
      return repository.add({
        ledgerId,
        regions: parsed.data.regions,
        payload: buildLedgerSetupMerchantPayload(keys, template),
      });
    },
  };
}
