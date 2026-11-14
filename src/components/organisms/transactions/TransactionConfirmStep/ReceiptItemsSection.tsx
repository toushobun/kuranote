"use client";
import Box from "@mui/material/Box";
import { ReceiptAddButton } from "./ReceiptAddButton";
import { ReceiptLoadingRow } from "./ReceiptLoadingRow";
import Typography from "@mui/material/Typography";
import { resolveTransactionBusinessStatus } from "internal/transaction";
import { TransactionBusinessBadge } from "atoms/TransactionBusinessBadge/TransactionBusinessBadge";
import { flowMessages as m } from "config/transactionStepFlowMessages";
import { transactionAccentColor } from "theme/transactionColors";
import {
  getMissingIncomeLinkKind,
  sumAmountTexts,
} from "../TransactionForm/TransactionForm.utils";
import { getLinkedIncomeDisplayAmounts } from "../transactionLinkedIncomeDisplay";
import type { TransactionItemSummary } from "../TransactionForm/TransactionForm.types";
import type { useTransactionForm } from "../TransactionForm/useTransactionForm";
import {
  formatStepCurrencyAmount,
  formatStepItemAmount,
} from "../transactionStepFlowFormat";
import { exceedsCurrencyDecimalPlaces } from "utils/transactionAmountInput";
import {
  ReceiptAmountButton,
  ReceiptAmountText,
  ReceiptLine,
} from "./ReceiptLine";

type IndexedItem = { item: TransactionItemSummary; index: number };
type ItemGroup = {
  label: string;
  category: NonNullable<TransactionItemSummary["category"]>;
  entries: IndexedItem[];
};

/** 小票的明细区：按大分类分组，保留每条明细原有的操作序号。 */
export function ReceiptItemsSection({
  form,
  showAutomaticNotice,
  invalidItems,
  canAddItem,
  itemsLoading = false,
  readOnly = false,
  onAmount,
}: {
  form: ReturnType<typeof useTransactionForm>;
  showAutomaticNotice?: boolean;
  /** 要标红的明细（只含上次点保存时已有、仍未解决的问题，#1040）。 */
  invalidItems: readonly TransactionItemSummary[];
  canAddItem: boolean;
  itemsLoading?: boolean;
  readOnly?: boolean;
  onAmount: (id: number) => void;
}) {
  const currency = form.selectedAccount?.currency ?? "";
  const items = form.itemSummaries;
  const groups = new Map<string, ItemGroup>();
  const uncategorized: IndexedItem[] = [];
  items.forEach((item, index) => {
    const category = item.category;
    const entry = { item, index };
    if (!category) {
      uncategorized.push(entry);
      return;
    }
    const id = category.parentId ?? category.id;
    const group = groups.get(id);
    if (group) {
      group.entries.push(entry);
    } else {
      groups.set(id, {
        label: category.parentName ?? category.name,
        category,
        entries: [entry],
      });
    }
  });

  function renderItem({ item, index }: IndexedItem) {
    const amount = formatStepItemAmount(item, currency);
    const excessDecimals = exceedsCurrencyDecimalPlaces(item.amount, currency);
    const invalid = invalidItems.includes(item);
    const missingLinkKind = getMissingIncomeLinkKind(item);
    const businessStatus =
      item.businessStatus ??
      resolveTransactionBusinessStatus({
        currency,
        specialStatus: item.specialStatus,
      });
    const { kind, offsetAmount, surplusAmount } =
      getLinkedIncomeDisplayAmounts(item);
    const isLinkedIncome = kind !== null;
    const amountNode = readOnly ? (
      <ReceiptAmountText
        amount={amount}
        income={item.category?.type === "income"}
      />
    ) : (
      <ReceiptAmountButton
        label={
          missingLinkKind
            ? m.selectOriginalExpense
            : m.editAmount(index + 1, amount)
        }
        amount={missingLinkKind ? m.selectOriginalExpense : amount}
        pending={
          !missingLinkKind && invalid && (!item.amount.trim() || excessDecimals)
        }
        income={item.category?.type === "income"}
        selectOriginalExpense={!!missingLinkKind}
        onClick={() =>
          missingLinkKind ? form.openItemSheet(item.id) : onAmount(item.id)
        }
      />
    );
    return (
      <ReceiptLine
        key={item.id}
        label={item.category?.name ?? m.missingCategory}
        truncateLabel
        compact={!!item.category}
        error={invalid}
        errorLabel={invalid && !!item.amount.trim()}
        subline={
          (businessStatus ||
            missingLinkKind ||
            isLinkedIncome ||
            (invalid && excessDecimals)) && (
            <>
              {missingLinkKind ? (
                <TransactionBusinessBadge
                  currency={currency}
                  status={{
                    incomeLinkRole: missingLinkKind,
                    offsetComposition: {
                      refundAmount: "0",
                      reimbursementAmount: "0",
                    },
                    settlementStatus: null,
                  }}
                />
              ) : businessStatus ? (
                <TransactionBusinessBadge
                  currency={currency}
                  status={{ ...businessStatus, surplusAmount: undefined }}
                />
              ) : null}
              {missingLinkKind && (
                <Typography
                  variant="caption"
                  sx={{ color: invalid ? "error.main" : "text.secondary" }}
                >
                  {m.originalExpenseNotSelected}
                </Typography>
              )}
              {isLinkedIncome && Number(item.amount) > 0 && (
                <Typography variant="caption" color="textSecondary">
                  {offsetAmount > 0
                    ? m.receiptOffset(
                        formatStepCurrencyAmount(
                          String(offsetAmount),
                          currency,
                        ),
                      )
                    : m.receiptSettled}
                </Typography>
              )}
              {invalid && excessDecimals && (
                <Typography variant="caption" sx={{ color: "error.main" }}>
                  {m.excessDecimalsHint}
                </Typography>
              )}
            </>
          )
        }
        sublineEnd={
          surplusAmount > 0 && (
            <TransactionBusinessBadge
              currency={currency}
              status={{
                incomeLinkRole: null,
                offsetComposition: {
                  refundAmount: "0",
                  reimbursementAmount: "0",
                },
                settlementStatus: null,
                surplusAmount: String(surplusAmount),
              }}
            />
          )
        }
        amount={amountNode}
        {...(!readOnly && {
          editLabel: m.editItem(index + 1),
          onEdit: () => form.openItemSheet(item.id),
          removeLabel: m.removeItem(index + 1),
          onRemove: () => form.removeItem(item.id),
        })}
      />
    );
  }

  return (
    <>
      {!readOnly && showAutomaticNotice && (
        <Typography variant="caption" sx={automaticNoticeSx}>
          {m.automaticNotice}
        </Typography>
      )}
      {[...groups].map(([id, { label, category, entries }]) => (
        <Box key={id} role="group" aria-label={label} sx={groupSx}>
          <Box sx={groupHeaderSx}>
            <Typography
              variant="caption"
              noWrap
              sx={{ minWidth: 0, fontWeight: 700 }}
            >
              {label}
            </Typography>
            {groups.size > 1 && (
              <Typography variant="caption" sx={subtotalSx}>
                {formatStepItemAmount(
                  {
                    amount: String(
                      sumAmountTexts(entries.map(({ item }) => item.amount)),
                    ),
                    category,
                  },
                  currency,
                )}
              </Typography>
            )}
          </Box>
          {entries.map(renderItem)}
        </Box>
      ))}
      {uncategorized.map(renderItem)}
      {!readOnly &&
        (itemsLoading ? (
          <ReceiptLoadingRow label={m.loadingItems} />
        ) : (
          <ReceiptAddButton
            label={m.addItem}
            onClick={form.openSheet}
            disabled={!canAddItem}
          />
        ))}
    </>
  );
}

/*
 * 样式 ④ 的留白（#1022），全部按上下文字边缘之间的可见空隙计算：
 *   A 同组明细之间 20px、B 组标题到本组首条 20px、C 组与组之间 30px、D 提示到首个组标题 16px。
 * 分组明细行盒 32px（compact），文字上下各已占约 9px；组标题行盒上下约 2px；
 * 下面的数值是扣除这些已占空间后的补足量。未选分类的明细保留 40px 行盒（上方约 13px），
 * 所以组后接未选分类时只需补 8px 就是 C。
 */
const automaticNoticeSx = {
  color: "text.secondary",
  display: "block",
  py: 0.5,
  "& + [role='group']": { mt: 1.125 }, // D
};

const groupSx = {
  display: "flex",
  flexDirection: "column",
  gap: 0.125, // A
  "& + [role='group']": { mt: 2.375 }, // C
  "& + :not([role='group'])": { mt: 1 }, // C（接未选分类）
};

const groupHeaderSx = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 1,
  color: transactionAccentColor,
  mb: 0.875, // B
};

const subtotalSx = {
  flexShrink: 0,
  whiteSpace: "nowrap",
  fontWeight: 700,
  fontVariantNumeric: "tabular-nums",
};
