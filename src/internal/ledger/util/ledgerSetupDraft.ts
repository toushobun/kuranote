import {
  ledgerSetupCashAccount,
  type LedgerSetupAccountType,
  type LedgerSetupTemplate,
  type LedgerSetupRegion,
} from "internal/ledger/entity/ledgerSetupTemplate/ledgerSetupTemplate";
import type {
  LedgerSetupDraft,
  LedgerSetupDraftAccount,
  StoredLedgerSetupDraft,
} from "internal/ledger/schema/ledgerSetupDraft";
import { getLedgerSetupTemplate } from "internal/ledger/entity/ledgerSetupTemplate/getLedgerSetupTemplate";

/**
 * 功能开关默认值，与新建账本的 ledger.transaction_item_special_status_enabled、
 * ledger.multi_account_payment_enabled 默认值一致。
 */
const defaultLedgerSetupFeatures = {
  multiAccountPaymentEnabled: false,
  specialStatusEnabled: false,
} as const;

/** 草稿的模板版本：有模板时为模板版本，无模板时为 null。 */
function templateVersionOf(template: LedgerSetupTemplate | null) {
  return template?.version ?? null;
}

/** 默认勾选标签下的全部商家；多标签商家只要任一所属标签默认勾选即选中。 */
function defaultSelectedMerchantKeys(template: LedgerSetupTemplate | null) {
  if (!template) return [];

  const defaultTagKeys = new Set(
    template.merchantTags
      .filter((tag) => tag.defaultSelected)
      .map((tag) => tag.key),
  );

  return template.merchants
    .filter((merchant) =>
      merchant.tagKeys.some((tagKey) => defaultTagKeys.has(tagKey)),
    )
    .map((merchant) => merchant.key);
}

/**
 * 根据账本生活地区对应的模板生成默认草稿：账户只有「现金」，
 * 商家为默认勾选标签下的全部商家，功能开关与现有账本设置的默认值一致。
 */
export function createDefaultLedgerSetupDraft(
  region: LedgerSetupRegion | null,
  template: LedgerSetupTemplate | null = getLedgerSetupTemplate(region),
): LedgerSetupDraft {
  return {
    accounts: {
      items: [{ ...ledgerSetupCashAccount }],
      skipped: false,
    },
    features: { ...defaultLedgerSetupFeatures },
    merchants: {
      selectedKeys: defaultSelectedMerchantKeys(
        template && {
          ...template,
          merchants: template.merchants.filter(
            (m) => region !== null && m.regions.includes(region),
          ),
        },
      ),
      skipped: false,
    },
    schemaVersion: 2,
    templateRegion: region,
    templateVersion: templateVersionOf(template),
  };
}

function isAccountTemplateKeyValid(
  template: LedgerSetupTemplate | null,
  type: LedgerSetupAccountType,
  templateKey: string,
) {
  if (!template || type === ledgerSetupCashAccount.type) return false;
  return Object.values(template.accountCandidatesByRegion).some((candidates) =>
    candidates[type].includes(templateKey),
  );
}

/** 恢复与保存共用地区范围，防止恢复后的草稿再次被判为过期。 */
function merchantKeysForRegions(
  template: LedgerSetupTemplate | null,
  region: LedgerSetupRegion | null,
  additionalRegions: readonly LedgerSetupRegion[] = [],
) {
  const regions = [region, ...additionalRegions];
  return new Set(
    template?.merchants
      .filter((merchant) =>
        merchant.regions.some((region) => regions.includes(region)),
      )
      .map(({ key }) => key),
  );
}

/** 判断草稿记录的模板地区、版本与引用的模板 key 是否与当前模板一致。 */
export function isLedgerSetupDraftMatchingTemplate(
  draft: LedgerSetupDraft,
  template: LedgerSetupTemplate | null = getLedgerSetupTemplate(
    draft.templateRegion,
  ),
): boolean {
  if (draft.templateVersion !== templateVersionOf(template)) return false;

  const merchantKeys = merchantKeysForRegions(
    template,
    draft.templateRegion,
    draft.merchants.additionalRegions,
  );

  return (
    draft.merchants.selectedKeys.every((key) => merchantKeys.has(key)) &&
    draft.accounts.items.every(
      ({ templateKey, type }) =>
        templateKey === undefined ||
        isAccountTemplateKeyValid(template, type, templateKey),
    )
  );
}

/**
 * 按账本当前生活地区的模板补全并校正草稿：缺失的部分使用默认值；
 * 模板地区或版本与当前不一致时，无法匹配当前模板的商家 key 被丢弃，
 * 账户保留名称但丢弃无法匹配的候选 key。
 */
export function resolveLedgerSetupDraft(
  stored: StoredLedgerSetupDraft,
  region: LedgerSetupRegion | null,
  template: LedgerSetupTemplate | null = getLedgerSetupTemplate(region),
): LedgerSetupDraft {
  const defaults = createDefaultLedgerSetupDraft(region, template);
  const merchantKeys = merchantKeysForRegions(
    template,
    region,
    stored.merchants?.additionalRegions,
  );

  const accounts = stored.accounts
    ? {
        ...stored.accounts,
        items: stored.accounts.items.map(
          ({ templateKey, ...account }): LedgerSetupDraftAccount =>
            templateKey !== undefined &&
            isAccountTemplateKeyValid(template, account.type, templateKey)
              ? { ...account, templateKey }
              : account,
        ),
      }
    : defaults.accounts;

  const merchants = stored.merchants
    ? {
        ...stored.merchants,
        selectedKeys: [...new Set(stored.merchants.selectedKeys)].filter(
          (key) => merchantKeys.has(key),
        ),
      }
    : defaults.merchants;

  return {
    accounts,
    features: stored.features ?? defaults.features,
    merchants,
    schemaVersion: 2,
    templateRegion: region,
    templateVersion: templateVersionOf(template),
  };
}
