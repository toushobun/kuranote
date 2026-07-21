import { accountTypeOptions } from "types/accounts";

// 服务端和客户端默认 locale 可能不同，固定 locale 以避免金额文本 hydration mismatch。
const defaultAmountDisplayLocale = "ja-JP";

export function getAccountTypeLabel(type: string) {
  return (
    accountTypeOptions.find((option) => option.value === type)?.label ?? "其他"
  );
}

export function getAccountHolderLabel({
  display_name,
  email,
}: {
  display_name: string;
  email: string | null;
}) {
  return display_name || email || "名称未设置";
}

export function formatAmount(amount: number | string | null, currency: string) {
  if (amount === null) {
    return `-- ${currency}`;
  }

  const numberAmount = typeof amount === "number" ? amount : Number(amount);

  if (!Number.isFinite(numberAmount)) {
    return `${amount} ${currency}`;
  }

  const normalizedCurrency = currency.trim().toUpperCase();

  try {
    // ja-JP locale 下 THB 没有对应的货币符号（会显示成「THB 1,234.50」），
    // narrowSymbol 才能取到泰铢符号「฿」。
    const currencyDisplay =
      normalizedCurrency === "THB" ? "narrowSymbol" : "symbol";

    const formatted = new Intl.NumberFormat(defaultAmountDisplayLocale, {
      currency,
      currencyDisplay,
      style: "currency",
    })
      .format(numberAmount)
      .replace(/\uFFE5/g, "¥");

    // ja-JP locale 下 CNY 的货币符号是前缀文案「元」（如「元 1,234.50」），
    // 与金额惯用的「1,234.50元」顺序相反，这里把「元」挪到金额之后。
    if (normalizedCurrency === "CNY") {
      return `${formatted.replace(/^(-?)元\s*/, "$1")}元`;
    }

    return formatted;
  } catch {
    return `${numberAmount} ${currency}`;
  }
}
