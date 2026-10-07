import { ledgerCurrencyOptions, type LedgerSetupProgress } from "types/ledgers";

/** 商家卡片中按商家标签汇总的已选数量。 */
export type LedgerSetupConfirmMerchantTag = {
  count: number;
  icon: string;
  key: string;
  name: string;
};

function getCurrencyLabel(currency: string) {
  return (
    ledgerCurrencyOptions.find(({ value }) => value === currency)?.label ??
    currency
  );
}

/**
 * 根据进度生成确认一览各卡片的内容。草稿已按账本当前默认货币与模板校正，
 * 这里只做展示用的汇总：跳过或数量为 0 时视为「已跳过」。
 * 完成页的账户数、商家数也取自这里，保证与确认一览一致。
 */
export function buildLedgerSetupConfirmSummary({
  setup,
  template,
}: LedgerSetupProgress) {
  const { accounts, features, merchants } = setup.draft;
  const accountNames = accounts.skipped
    ? []
    : accounts.items.map(({ name }) => name);

  const selectedKeys = new Set(merchants.skipped ? [] : merchants.selectedKeys);
  const selectedMerchants = (template?.merchants ?? []).filter(({ key }) =>
    selectedKeys.has(key),
  );
  const merchantTags: LedgerSetupConfirmMerchantTag[] = [
    ...(template?.merchantTags ?? []),
  ]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(({ icon, key, name }) => ({
      count: selectedMerchants.filter(({ tagKeys }) => tagKeys.includes(key))
        .length,
      icon,
      key,
      name,
    }))
    .filter(({ count }) => count > 0);

  return {
    accounts: { names: accountNames, skipped: accountNames.length === 0 },
    basicInfo: {
      currencyLabel: getCurrencyLabel(setup.baseCurrency),
      displayColor: setup.displayColor,
      displayName: setup.displayName,
      ledgerName: setup.name,
    },
    merchants: {
      // 多标签商家只算一次。
      count: selectedMerchants.length,
      skipped: selectedMerchants.length === 0,
      tags: merchantTags,
    },
    specialStatusEnabled: features.specialStatusEnabled,
  };
}
