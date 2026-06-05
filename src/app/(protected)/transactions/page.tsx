import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { TransactionMonthList } from "transactions/TransactionMonthList";
import { GlassCard } from "ui/GlassCard";
import { getCurrentLedgerOrRedirect } from "lib/ledger/current-ledger";

import { voidTransaction } from "./actions";
import { loadTransactionMonthView } from "./list-actions";

type TransactionsPageProps = {
  searchParams: Promise<{
    error?: string;
    month?: string;
  }>;
};

const errorMessages: Record<string, string> = {
  void_failed: "记账撤销失败。请稍后重试。",
  void_invalid: "撤销对象不正确。",
};

export default async function TransactionsPage({
  searchParams,
}: TransactionsPageProps) {
  const currentLedger = await getCurrentLedgerOrRedirect();
  const params = await searchParams;
  const errorMessage = params.error
    ? (errorMessages[params.error] ?? null)
    : null;
  const monthView = await loadTransactionMonthView(params.month);

  return (
    <GlassCard sx={{ p: { xs: 4, sm: 5 } }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        sx={{ alignItems: { xs: "flex-start", sm: "center" } }}
      >
        <Stack sx={{ flex: 1 }}>
          <Typography component="h1" variant="h4" sx={{ fontWeight: 700 }}>
            明细
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 2 }}>
            当前账本：{currentLedger.name}
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 2 }}>
            按月份查看收入、支出和每日明细。
          </Typography>
        </Stack>

        <Button href="/transactions/new" variant="contained">
          新增记录
        </Button>
      </Stack>

      <Stack
        direction="row"
        spacing={1.5}
        sx={{ alignItems: "center", justifyContent: "space-between", mt: 4 }}
      >
        <Button href={`/transactions?month=${monthView.previousMonth}`}>
          上一月
        </Button>
        <Typography sx={{ fontWeight: 700 }} variant="h6">
          {monthView.monthLabel}
        </Typography>
        <Button href={`/transactions?month=${monthView.nextMonth}`}>
          下一月
        </Button>
      </Stack>

      {errorMessage ? (
        <Typography color="error" sx={{ mt: 3 }}>
          {errorMessage}
        </Typography>
      ) : null}

      <TransactionMonthList
        monthView={monthView}
        voidAction={voidTransaction}
      />
    </GlassCard>
  );
}
