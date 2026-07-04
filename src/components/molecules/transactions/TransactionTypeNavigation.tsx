"use client";

import { SegmentTabs } from "molecules/ui/SegmentTabs";

export type TransactionTypeNavigationValue = "normal" | "transfer";

const typeNavItems = [
  { label: "收支", value: "normal" },
  { label: "转账", value: "transfer" },
] as const;

type TransactionTypeNavigationProps = {
  activeType: TransactionTypeNavigationValue;
  onChange: (type: TransactionTypeNavigationValue) => void;
};

export function TransactionTypeNavigation({
  activeType,
  onChange,
}: TransactionTypeNavigationProps) {
  return (
    <SegmentTabs
      ariaLabel="记账类型"
      items={typeNavItems}
      value={activeType}
      onChange={(value) => {
        if (value === "normal" || value === "transfer") onChange(value);
      }}
    />
  );
}
