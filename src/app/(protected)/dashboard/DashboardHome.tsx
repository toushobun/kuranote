import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { formatAmount } from "../accounts/types";

import type { DashboardViewData } from "./summary-types";

type DashboardHomeProps = {
  data: DashboardViewData;
};

function SummaryRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <Stack spacing={0.5} sx={{ flex: 1 }}>
      <Typography color="text.secondary" variant="caption">
        {label}
      </Typography>
      <Typography sx={{ fontWeight: 800 }}>{value}</Typography>
    </Stack>
  );
}

export function DashboardHome({ data }: DashboardHomeProps) {
  return (
    <Stack spacing={3}>
      <Stack spacing={0.8}>
        <Typography component="h1" sx={{ fontSize: 26, fontWeight: 900 }}>
          首页
        </Typography>
        <Typography color="text.secondary" variant="body2">
          当前账本：{data.ledgerName}
        </Typography>
      </Stack>

      <Stack
        spacing={1.5}
        sx={{ bgcolor: "#f4efff", borderRadius: 4, p: 2 }}
      >
        <Typography color="text.secondary" variant="caption">
          {data.monthLabel}概况
        </Typography>
        <Stack direction="row" spacing={1.5}>
          <SummaryRow
            label="收入"
            value={formatAmount(
              data.monthSummary.income,
              data.monthSummary.currency,
            )}
          />
          <SummaryRow
            label="支出"
            value={formatAmount(
              data.monthSummary.expense,
              data.monthSummary.currency,
            )}
          />
          <SummaryRow
            label="结余"
            value={formatAmount(
              data.monthSummary.balance,
              data.monthSummary.currency,
            )}
          />
        </Stack>
      </Stack>

      <Stack direction="row" spacing={1.5}>
        <SummaryRow
          label="账户总余额"
          value={formatAmount(
            data.accountSummary.totalBalance,
            data.accountSummary.currency,
          )}
        />
        <SummaryRow
          label="账户数量"
          value={`${data.accountSummary.accountCount} 个`}
        />
      </Stack>

      <Stack direction="row" spacing={1.5}>
        <Button href="/transactions/new" variant="contained">
          新增记账
        </Button>
        <Button href="/transactions" variant="outlined">
          查看明细
        </Button>
      </Stack>

      <Stack spacing={1.2}>
        <Typography sx={{ fontWeight: 800 }}>最近明细</Typography>
        {data.recentTransactions.length > 0 ? (
          data.recentTransactions.map((transaction) => (
            <Stack direction="row" key={transaction.id} spacing={1.5}>
              <Typography sx={{ flex: 1 }}>
                {transaction.merchant_name ?? transaction.category_name ?? "记账记录"}
              </Typography>
              <Typography sx={{ fontWeight: 800 }}>
                {transaction.type === "expense" ? "-" : "+"}
                {formatAmount(transaction.amount, transaction.account_currency)}
              </Typography>
            </Stack>
          ))
        ) : (
          <Typography color="text.secondary" sx={{ py: 2, textAlign: "center" }}>
            本月还没有记账记录。
          </Typography>
        )}
      </Stack>
    </Stack>
  );
}
