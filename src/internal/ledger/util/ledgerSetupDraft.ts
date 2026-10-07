import type { LedgerCurrency } from "internal/ledger/entity/ledgerCurrency";
import {
  getLedgerSetupTemplate,
  ledgerSetupCashAccount,
  type LedgerSetupAccountType,
  type LedgerSetupTemplate,
} from "internal/ledger/entity/ledgerSetupTemplate/ledgerSetupTemplate";
import type {
  LedgerSetupDraft,
  LedgerSetupDraftAccount,
  StoredLedgerSetupDraft,
} from "internal/ledger/schema/ledgerSetupDraft";

/** 功能开关默认值，与新建账本的 ledger.transaction_item_special_status_enabled 默认值一致。 */
const defaultLedgerSetupFeatures = { specialStatusEnabled: false } as const;

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
 * 根据账本默认货币对应的模板生成默认草稿：账户只有「现金」，
 * 商家为默认勾选标签下的全部商家，功能开关与现有账本设置的默认值一致。
 */
export function createDefaultLedgerSetupDraft(
  currency: LedgerCurrency,
): LedgerSetupDraft {
  const template = getLedgerSetupTemplate(currency);

  return {
    accounts: {
      items: [{ ...ledgerSetupCashAccount }],
      skipped: false,
    },
    features: { ...defaultLedgerSetupFeatures },
    merchants: {
      selectedKeys: defaultSelectedMerchantKeys(template),
      skipped: false,
    },
    templateCurrency: currency,
    templateVersion: templateVersionOf(template),
  };
}

function isAccountTemplateKeyValid(
  template: LedgerSetupTemplate | null,
  type: LedgerSetupAccountType,
  templateKey: string,
) {
  if (!template || type === ledgerSetupCashAccount.type) return false;
  return template.accountCandidates[type].includes(templateKey);
}

/** 判断草稿记录的模板币种、版本与引用的模板 key 是否与当前模板一致。 */
export function isLedgerSetupDraftMatchingTemplate(
  draft: LedgerSetupDraft,
): boolean {
  const template = getLedgerSetupTemplate(draft.templateCurrency);

  if (draft.templateVersion !== templateVersionOf(template)) return false;

  const merchantKeys = new Set(template?.merchants.map(({ key }) => key));

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
 * 按账本当前默认货币的模板补全并校正草稿：缺失的部分使用默认值；
 * 模板币种或版本与当前不一致时，无法匹配当前模板的商家 key 被丢弃，
 * 账户保留名称但丢弃无法匹配的候选 key。
 */
export function resolveLedgerSetupDraft(
  stored: StoredLedgerSetupDraft,
  currency: LedgerCurrency,
): LedgerSetupDraft {
  const template = getLedgerSetupTemplate(currency);
  const defaults = createDefaultLedgerSetupDraft(currency);
  const merchantKeys = new Set(template?.merchants.map(({ key }) => key));

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
    templateCurrency: currency,
    templateVersion: templateVersionOf(template),
  };
}

function accountNameScopeKey({ name, type }: LedgerSetupDraftAccount) {
  return `${type}\u0000${name.trim().toLowerCase()}`;
}

/**
 * 草稿内账户名称是否重复。唯一范围与 #781 一致（账本 + 名称 + 类型 + 货币 + 持有人）；
 * 向导中货币均为账本默认货币、持有人均为当前用户，因此按「类型 + 名称（忽略大小写）」判断。
 */
export function hasDuplicateLedgerSetupAccountName(
  accounts: readonly LedgerSetupDraftAccount[],
): boolean {
  const keys = accounts.map(accountNameScopeKey);
  return new Set(keys).size !== keys.length;
}
