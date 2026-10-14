import {
  buildLedgerSetupMerchantPayload,
  getLedgerSetupTemplate,
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
import { getAddedMerchantPresetKeys } from "utils/merchantPresets";

export interface MerchantPresetService {
  load(ledgerId: string): Promise<MerchantPresetOptions>;
  add(ledgerId: string, input: MerchantPresetInput): Promise<number>;
}

export function createMerchantPresetService({
  merchantService,
  repository,
}: {
  merchantService: Pick<MerchantService, "assertCanManage">;
  repository: MerchantPresetRepository;
}): MerchantPresetService {
  async function load(ledgerId: string): Promise<MerchantPresetOptions> {
    await merchantService.assertCanManage({ ledgerId });
    const currency = await repository.getCurrency(ledgerId);
    const template = getLedgerSetupTemplate(currency);
    const addedKeys = template
      ? getAddedMerchantPresetKeys(
          template,
          await repository.listExistingNames(ledgerId),
        )
      : [];
    return { currency, template, addedKeys };
  }
  return {
    load,
    async add(ledgerId, input) {
      const options = await load(ledgerId);
      const parsed = merchantPresetInputSchema.safeParse(input);
      const { template } = options;
      if (
        !parsed.success ||
        !template ||
        parsed.data.currency !== options.currency ||
        parsed.data.templateVersion !== template.version ||
        parsed.data.selectedKeys.some(
          (key) => !template.merchants.some((merchant) => merchant.key === key),
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
        currency: options.currency,
        payload: buildLedgerSetupMerchantPayload(keys, template),
      });
    },
  };
}
