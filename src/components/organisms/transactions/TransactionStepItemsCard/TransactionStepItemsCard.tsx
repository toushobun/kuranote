"use client";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import CategoryRoundedIcon from "@mui/icons-material/CategoryRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ButtonBase from "@mui/material/ButtonBase";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { resolveTransactionBusinessStatus } from "internal/transaction";
import { TransactionBusinessBadge } from "atoms/TransactionBusinessBadge/TransactionBusinessBadge";
import { flowMessages as m } from "config/transactionStepFlowMessages";
import type { TransactionItemSummary } from "organisms/transactions/TransactionForm/TransactionForm.types";
import { formatUnsignedCurrencyAmount } from "utils/transactions";

export type TransactionStepItemsCardProps = {
  items: TransactionItemSummary[];
  automaticItemIds: readonly number[];
  currency: string;
  expenseTotal: number;
  incomeTotal: number;
  hasCategoryOptions: boolean;
  onAdd: () => void;
  onEdit: (id: number) => void;
  onAmount: (id: number) => void;
  onRemove: (id: number) => void;
};
export function TransactionStepItemsCard({
  items,
  automaticItemIds,
  currency,
  expenseTotal,
  incomeTotal,
  hasCategoryOptions,
  onAdd,
  onEdit,
  onAmount,
  onRemove,
}: TransactionStepItemsCardProps) {
  const format = (amount: string | number) =>
    formatUnsignedCurrencyAmount(String(amount), currency);
  return (
    <Stack spacing={1}>
      <Paper variant="outlined" sx={{ overflow: "hidden" }}>
        {items.map((item, index) => {
          const businessStatus =
            item.businessStatus ??
            resolveTransactionBusinessStatus({
              currency,
              specialStatus: item.specialStatus,
            });
          return (
            <Box
              key={item.id}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                px: 1.5,
                py: 1,
                minHeight: 52,
              }}
            >
              <ButtonBase
                aria-label={m.editItem(index + 1)}
                onClick={() => onEdit(item.id)}
                sx={{
                  display: "flex",
                  gap: 1,
                  flex: 1,
                  minWidth: 0,
                  justifyContent: "flex-start",
                  textAlign: "left",
                }}
              >
                {item.category?.iconName ? (
                  <Box component="span" aria-hidden="true">
                    {item.category.iconName}
                  </Box>
                ) : (
                  <CategoryRoundedIcon color="action" fontSize="small" />
                )}
                <Typography variant="body2">
                  {item.category
                    ? [item.category.parentName, item.category.name]
                        .filter(Boolean)
                        .join(" · ")
                    : m.missingCategory}
                </Typography>
              </ButtonBase>
              {automaticItemIds.includes(item.id) && (
                <Chip label={m.automatic} size="small" />
              )}
              {businessStatus && (
                <TransactionBusinessBadge
                  currency={currency}
                  status={businessStatus}
                />
              )}
              <Button
                aria-label={m.editAmount(index + 1)}
                onClick={() => onAmount(item.id)}
                sx={{
                  color:
                    item.category?.type === "income"
                      ? "success.main"
                      : "text.primary",
                  minWidth: 64,
                  px: 0,
                }}
              >
                {item.amount.trim()
                  ? `${item.category?.type === "income" ? "+ " : ""}${format(item.amount)}`
                  : m.pendingAmount}
              </Button>
              <IconButton
                size="small"
                aria-label={m.removeItem(index + 1)}
                onClick={() => onRemove(item.id)}
              >
                <CloseRoundedIcon fontSize="small" />
              </IconButton>
            </Box>
          );
        })}
        <Button
          fullWidth
          startIcon={<AddRoundedIcon />}
          onClick={onAdd}
          disabled={!hasCategoryOptions}
          sx={{ py: 1.5 }}
        >
          {m.addItem}
        </Button>
        {items.length > 0 && (
          <>
            <Divider sx={{ mx: 1.5 }} />
            <Stack
              direction="row"
              sx={{
                p: 2,
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Stack>
                <Typography sx={{ fontWeight: 700 }}>{m.total}</Typography>
                {items.some((item) => item.category?.type === "income") && (
                  <Typography variant="caption" color="textSecondary">
                    {m.incomeExpense(format(expenseTotal), format(incomeTotal))}
                  </Typography>
                )}
              </Stack>
              <Typography variant="h5" color="primary" sx={{ fontWeight: 800 }}>
                {incomeTotal > expenseTotal ? "+ " : ""}
                {format(expenseTotal - incomeTotal)}
              </Typography>
            </Stack>
          </>
        )}
      </Paper>
      {items.length === 0 && (
        <Typography
          variant="caption"
          color="textSecondary"
          sx={{ textAlign: "center" }}
        >
          {m.emptyItemsHint}
        </Typography>
      )}
    </Stack>
  );
}
