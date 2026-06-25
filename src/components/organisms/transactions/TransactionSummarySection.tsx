import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { SectionCard } from "molecules/ui/SectionCard";
import type {
  TransactionAccountOption,
  TransactionMerchantOption,
} from "types/transactions";

import type { TransactionItemSummary } from "./TransactionForm.types";
import {
  formatCategoryName,
  formatSummaryDateTime,
} from "./TransactionForm.utils";

type TransactionSummarySectionProps = {
  itemSummaries: TransactionItemSummary[];
  selectedAccount?: TransactionAccountOption;
  selectedMerchant?: TransactionMerchantOption;
  selectedTagNames: string[];
  signedTotalAmount: string;
  transactionDate: string;
  transactionTime: string;
};

export function TransactionSummarySection({
  itemSummaries,
  selectedAccount,
  selectedMerchant,
  selectedTagNames,
  signedTotalAmount,
  transactionDate,
  transactionTime,
}: TransactionSummarySectionProps) {
  return (
    <SectionCard sx={{ p: 2 }}>
      <Stack spacing={1.5}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          保存前汇总
        </Typography>
        <SummaryRow label="商家" value={selectedMerchant?.name ?? "未选择"} />
        <SummaryRow
          label="账户"
          value={
            selectedAccount
              ? `${selectedAccount.name}（${selectedAccount.currency}）`
              : "未选择"
          }
        />
        {itemSummaries.map((item, index) => (
          <SummaryRow
            key={item.id}
            label={`明细 ${index + 1}`}
            value={`${item.category ? formatCategoryName(item.category) : "未选择分类"} / ${item.amount || "未填写金额"}`}
          />
        ))}
        <SummaryRow
          label="标签"
          value={
            selectedTagNames.length > 0 ? selectedTagNames.join("、") : "未选择"
          }
        />
        <SummaryRow
          label="时间"
          value={formatSummaryDateTime(transactionDate, transactionTime)}
        />
        <Divider />
        <SummaryRow label="合计金额" value={signedTotalAmount} strong />
      </Stack>
    </SectionCard>
  );
}

function SummaryRow({
  label,
  strong = false,
  value,
}: {
  label: string;
  strong?: boolean;
  value: string;
}) {
  return (
    <Stack
      direction="row"
      spacing={2}
      sx={{ alignItems: "center", justifyContent: "space-between" }}
    >
      <Typography color="text.secondary" variant="body2">
        {label}
      </Typography>
      <Typography
        sx={{ fontWeight: strong ? 700 : 500, textAlign: "right" }}
        variant={strong ? "subtitle1" : "body2"}
      >
        {value}
      </Typography>
    </Stack>
  );
}
