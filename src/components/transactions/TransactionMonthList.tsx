"use client";

import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import type {
  TransactionAmountSummary,
  TransactionListItem,
  TransactionMonthView,
} from "transactions-route/types";

type TransactionMonthListProps = {
  monthView: TransactionMonthView;
  voidAction?: (formData: FormData) => void;
};

function formatAmount(amount: string, currency: string) {
  const value = Number(amount);

  if (!Number.isFinite(value)) {
    return currency ? `${amount} ${currency}` : amount;
  }

  const formattedAmount = new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(value);

  return currency ? `${formattedAmount} ${currency}` : formattedAmount;
}

function formatSignedAmount(
  type: "expense" | "income",
  amount: string,
  currency: string,
) {
  return `${type === "expense" ? "-" : "+"}${formatAmount(amount, currency)}`;
}

function getMerchantInitial(name: string | null) {
  return name?.trim().charAt(0).toUpperCase() || "记";
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <Stack spacing={0.5} sx={{ minWidth: 0 }}>
      <Typography color="text.secondary" variant="body2">
        {label}
      </Typography>
      <Typography sx={{ fontWeight: 700 }} variant="body1">
        {value}
      </Typography>
    </Stack>
  );
}

function MonthSummary({ summary }: { summary: TransactionAmountSummary }) {
  return (
    <Card variant="outlined" sx={{ mt: 3 }}>
      <CardContent>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2.5}>
          <SummaryItem
            label="收入"
            value={formatAmount(summary.income, summary.currency)}
          />
          <SummaryItem
            label="支出"
            value={formatAmount(summary.expense, summary.currency)}
          />
          <SummaryItem
            label="结余"
            value={formatAmount(summary.balance, summary.currency)}
          />
        </Stack>
      </CardContent>
    </Card>
  );
}

function TransactionRow({
  item,
  voidAction,
}: {
  item: TransactionListItem;
  voidAction?: (formData: FormData) => void;
}) {
  const merchantName = item.merchant_name ?? "未指定商家";

  return (
    <Stack direction="row" spacing={1.5} sx={{ py: 1.5 }}>
      <Avatar
        alt={merchantName}
        src={item.merchant_icon_url ?? undefined}
        sx={{ height: 40, width: 40 }}
      >
        {getMerchantInitial(item.merchant_name)}
      </Avatar>

      <Stack spacing={0.5} sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontWeight: 700 }} variant="body1">
          {merchantName}
        </Typography>
        <Typography color="text.secondary" variant="body2">
          {item.category_name ?? "未分类"} · {item.account_name} ·{" "}
          {new Date(item.transaction_at).toLocaleTimeString(undefined, {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Typography>
        {item.note ? (
          <Typography color="text.secondary" variant="body2">
            {item.note}
          </Typography>
        ) : null}
      </Stack>

      <Stack spacing={0.5} sx={{ alignItems: "flex-end" }}>
        <Typography sx={{ fontWeight: 700, whiteSpace: "nowrap" }}>
          {formatSignedAmount(item.type, item.amount, item.account_currency)}
        </Typography>
        {voidAction ? (
          <form
            action={voidAction}
            onSubmit={(event) => {
              if (!window.confirm("确定要撤销这条记录吗？")) {
                event.preventDefault();
              }
            }}
          >
            <input name="transactionRecordId" type="hidden" value={item.id} />
            <Button color="error" size="small" type="submit" variant="text">
              撤销
            </Button>
          </form>
        ) : null}
      </Stack>
    </Stack>
  );
}

export function TransactionMonthList({
  monthView,
  voidAction,
}: TransactionMonthListProps) {
  if (monthView.groups.length === 0) {
    return (
      <Stack spacing={3} sx={{ mt: 3 }}>
        <MonthSummary summary={monthView.summary} />
        <Typography color="text.secondary">这个月还没有记账记录。</Typography>
      </Stack>
    );
  }

  return (
    <Stack spacing={3} sx={{ mt: 3 }}>
      <MonthSummary summary={monthView.summary} />

      <Stack spacing={2.5}>
        {monthView.groups.map((group) => (
          <Card key={group.date} variant="outlined">
            <CardContent>
              <Stack
                direction="row"
                spacing={2}
                sx={{ alignItems: "center", justifyContent: "space-between" }}
              >
                <Typography sx={{ fontWeight: 700 }} variant="h6">
                  {group.label}
                </Typography>
                <Typography color="text.secondary" variant="body2">
                  当日{" "}
                  {formatAmount(group.summary.balance, group.summary.currency)}
                </Typography>
              </Stack>

              <Stack divider={<Divider flexItem />} sx={{ mt: 1 }}>
                {group.items.map((item) => (
                  <TransactionRow
                    item={item}
                    key={item.id}
                    voidAction={voidAction}
                  />
                ))}
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Stack>
    </Stack>
  );
}
