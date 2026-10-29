"use client";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { resolveTransactionBusinessStatus } from "internal/transaction";
import { TransactionBusinessBadge } from "atoms/TransactionBusinessBadge/TransactionBusinessBadge";
import { flowMessages as m } from "config/transactionStepFlowMessages";
import type { TransactionItemSummary } from "../TransactionForm/TransactionForm.types";
import type { useTransactionForm } from "../TransactionForm/useTransactionForm";
import {
  formatStepItemAmount,
  formatStepItemCategory,
} from "../transactionStepFlowFormat";
import { ReceiptAmountButton, ReceiptLine } from "./ReceiptLine";

/** 小票的明细区：提示、每条明细（标签、金额、铅笔、×）与「＋ 添加明细」。 */
export function ReceiptItemsSection({
  form,
  automaticItemIds,
  invalidItems,
  merchantHasHistory,
  canAddItem,
  onAmount,
}: {
  form: ReturnType<typeof useTransactionForm>;
  automaticItemIds: readonly number[];
  invalidItems: readonly TransactionItemSummary[];
  merchantHasHistory?: boolean;
  canAddItem: boolean;
  onAmount: (id: number) => void;
}) {
  const currency = form.selectedAccount?.currency ?? "";
  const items = form.itemSummaries;
  return (
    <>
      {automaticItemIds.length > 0 && (
        <Typography variant="caption" sx={hintSx}>
          {m.automaticNotice(automaticItemIds.length)}
        </Typography>
      )}
      {items.length === 0 &&
        (merchantHasHistory === false ? (
          <Typography variant="body2" sx={[hintSx, { textAlign: "center" }]}>
            {m.noMerchantHistory}
          </Typography>
        ) : (
          <Typography
            variant="body2"
            data-invalid="true"
            sx={{ color: "error.main", py: 0.75, textAlign: "center" }}
          >
            {m.missingItems}
          </Typography>
        ))}
      {items.map((item, index) => {
        const name = formatStepItemCategory(item.category);
        const amount = formatStepItemAmount(item, currency);
        const businessStatus =
          item.businessStatus ??
          resolveTransactionBusinessStatus({
            currency,
            specialStatus: item.specialStatus,
          });
        return (
          <ReceiptLine
            key={item.id}
            label={name}
            error={invalidItems.includes(item)}
            errorLabel={invalidItems.includes(item) && !!item.amount.trim()}
            tags={
              businessStatus && (
                <TransactionBusinessBadge
                  currency={currency}
                  status={businessStatus}
                />
              )
            }
            amount={
              <ReceiptAmountButton
                label={m.editAmount(index + 1, amount)}
                amount={amount}
                pending={!item.amount.trim()}
                income={item.category?.type === "income"}
                onClick={() => onAmount(item.id)}
              />
            }
            editLabel={m.editItem(index + 1)}
            onEdit={() => form.openItemSheet(item.id)}
            removeLabel={m.removeItem(index + 1)}
            onRemove={() => form.removeItem(item.id)}
          />
        );
      })}
      <Button
        fullWidth
        startIcon={<AddRoundedIcon />}
        onClick={form.openSheet}
        disabled={!canAddItem}
      >
        {m.addItem}
      </Button>
    </>
  );
}

const hintSx = { color: "text.secondary", display: "block", py: 0.5 };
