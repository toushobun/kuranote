import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { TransactionMonthList } from "transactions/TransactionMonthList";
import { GlassCard } from "ui/GlassCard";

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

const palePurple = "#f0e9fb";

export default async function TransactionsPage({
  searchParams,
}: TransactionsPageProps) {
  const params = await searchParams;
  const errorMessage = params.error
    ? (errorMessages[params.error] ?? null)
    : null;
  const monthView = await loadTransactionMonthView(params.month);

  return (
    <GlassCard
      sx={{
        bgcolor: "#fbf8ff",
        maxWidth: 430,
        mx: "auto",
        p: { xs: 2, sm: 3 },
      }}
    >
      <Stack spacing={2.2}>
        <Stack
          direction="row"
          sx={{ alignItems: "center", justifyContent: "space-between" }}
        >
          <Typography component="h1" sx={{ fontSize: 24, fontWeight: 900 }}>
            明细
          </Typography>
          <Box
            aria-label="筛选"
            component="span"
            sx={{
              color: "text.primary",
              cursor: "pointer",
              fontSize: 22,
              fontWeight: 900,
              lineHeight: 1,
            }}
          >
            ≡
          </Box>
        </Stack>

        <Stack
          direction="row"
          sx={{
            alignItems: "center",
            bgcolor: palePurple,
            borderRadius: 999,
            color: "text.secondary",
            height: 44,
            justifyContent: "space-between",
            px: 1.3,
          }}
        >
          <Button
            href={`/transactions?month=${monthView.previousMonth}`}
            size="small"
            sx={{ color: "text.secondary", minWidth: 40 }}
          >
            &lt;
          </Button>
          <Typography sx={{ fontWeight: 800 }}>
            {monthView.monthLabel}
          </Typography>
          <Button
            href={`/transactions?month=${monthView.nextMonth}`}
            size="small"
            sx={{ color: "text.secondary", minWidth: 40 }}
          >
            &gt;
          </Button>
        </Stack>

        {errorMessage ? (
          <Typography color="error" sx={{ fontWeight: 700 }} variant="body2">
            {errorMessage}
          </Typography>
        ) : null}
      </Stack>

      <TransactionMonthList
        monthView={monthView}
        voidAction={voidTransaction}
      />
    </GlassCard>
  );
}
