import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Typography from "@mui/material/Typography";
import { useState } from "react";

import { allocateRefundAmount } from "internal/transaction";
import { TransactionMonthList } from "../TransactionMonthList/TransactionMonthList";
import { TransactionSearchTemplate } from "templates/transactions/TransactionSearch";
import type {
  TransactionGroupPage,
  TransactionMonthPage,
  TransactionRefundCandidate,
  TransactionSearchPage,
  TransactionTimeGroupViewData,
} from "types/transactions";
import { getCurrencySymbol } from "utils/currency";
import { formatNumber } from "utils/transactions";

type TransactionRefundLinkPickerProps = {
  loadGroupItemsAction?: (
    groupKey: string,
    offset: number,
  ) => Promise<TransactionMonthPage>;
  loadMoreGroupsAction?: (offset: number) => Promise<TransactionGroupPage>;
  loadSearchPageAction?: (
    query: string,
    offset: number,
  ) => Promise<TransactionSearchPage>;
  onChange: (items: TransactionRefundCandidate[]) => void;
  refundAmount?: string;
  timeGroupView?: TransactionTimeGroupViewData;
  value?: TransactionRefundCandidate[] | null;
};

const emptySearchPage: TransactionSearchPage = {
  items: [],
  nextOffset: null,
  totalCount: 0,
};

export function TransactionRefundLinkPicker({
  loadGroupItemsAction,
  loadMoreGroupsAction,
  loadSearchPageAction,
  onChange,
  refundAmount = "0",
  timeGroupView,
  value,
}: TransactionRefundLinkPickerProps) {
  const selectedValue = value ?? [];
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"browse" | "search">("browse");
  const [draftValue, setDraftValue] = useState<TransactionRefundCandidate[]>(
    [],
  );
  const allocations = allocateRefundAmount(refundAmount, selectedValue);
  const allocationByItemId = new Map(
    (allocations ?? []).map((allocation) => [
      allocation.refundedItemId,
      allocation.refundAmount,
    ]),
  );
  const selectedIds = draftValue.map((item) => item.id);

  const openPicker = () => {
    setDraftValue(selectedValue);
    setOpen(true);
  };
  const close = () => setOpen(false);
  const toggle = (item: TransactionRefundCandidate) => {
    setDraftValue((current) =>
      current.some((candidate) => candidate.id === item.id)
        ? current.filter((candidate) => candidate.id !== item.id)
        : [...current, item],
    );
  };
  const confirm = () => {
    if (
      draftValue.length > 0 &&
      allocateRefundAmount(refundAmount, draftValue) === null
    ) {
      return;
    }
    onChange(draftValue);
    close();
  };

  return (
    <Stack component="section" spacing={0.75} sx={containerSx}>
      <Typography sx={{ fontWeight: 900 }}>退款关联</Typography>
      {selectedValue.length > 0 ? (
        <Stack spacing={0.75}>
          {selectedValue.map((item) => (
            <Stack direction="row" key={item.id} sx={selectedSx}>
              <Stack>
                <Typography sx={{ fontWeight: 800 }} variant="body2">
                  {item.categoryName} ·{" "}
                  {getCurrencySymbol(item.accountCurrency)}
                  {formatNumber(item.amount)}
                </Typography>
                <Typography color="text.secondary" variant="caption">
                  本次分摊 {getCurrencySymbol(item.accountCurrency)}
                  {formatNumber(String(allocationByItemId.get(item.id) ?? 0))} ·
                  剩余可退 {getCurrencySymbol(item.accountCurrency)}
                  {formatNumber(item.remainingRefundableAmount)}
                </Typography>
              </Stack>
            </Stack>
          ))}
          <Button onClick={() => onChange([])}>取消全部关联</Button>
          {allocations === null ? (
            <Typography color="error" variant="caption">
              当前金额无法向每条所选明细分摊至少 0.01，请调整金额或选择。
            </Typography>
          ) : null}
        </Stack>
      ) : (
        <Typography color="text.secondary" variant="caption">
          可选择多条历史支出，退款金额将按各明细剩余可退金额比例自动分摊。
        </Typography>
      )}
      <Button onClick={openPicker} variant="outlined">
        {selectedValue.length > 0
          ? `已选择 ${selectedValue.length} 条，重新选择`
          : "选择退款明细"}
      </Button>

      <Dialog fullScreen onClose={close} open={open}>
        <Stack direction="row" sx={headerSx}>
          <IconButton aria-label="关闭退款关联选择器" onClick={close}>
            <ArrowBackRoundedIcon />
          </IconButton>
          <Typography component="h2" sx={{ flex: 1, fontWeight: 900 }}>
            选择退款明细
          </Typography>
          <Button
            disabled={
              draftValue.length > 0 &&
              allocateRefundAmount(refundAmount, draftValue) === null
            }
            onClick={confirm}
          >
            完成{draftValue.length > 0 ? `（${draftValue.length}）` : ""}
          </Button>
        </Stack>
        <Tabs
          onChange={(_, next) => setTab(next)}
          value={tab}
          variant="fullWidth"
        >
          <Tab label="按月浏览" value="browse" />
          <Tab label="搜索" value="search" />
        </Tabs>
        <DialogContent>
          {tab === "browse" ? (
            timeGroupView ? (
              <TransactionMonthList
                loadGroupItemsAction={loadGroupItemsAction}
                loadMoreGroupsAction={loadMoreGroupsAction}
                onSelectRefundItem={toggle}
                refundSelectionMode
                selectedRefundItemIds={selectedIds}
                timeGroupView={timeGroupView}
              />
            ) : (
              <Typography color="text.secondary">
                支出明细加载失败，请稍后重试。
              </Typography>
            )
          ) : (
            <TransactionSearchTemplate
              errorMessage={null}
              initialPage={emptySearchPage}
              initialQuery=""
              loadSearchPageAction={loadSearchPageAction}
              onClose={close}
              onSelectRefundItem={toggle}
              refundSelectionMode
              selectedRefundItemIds={selectedIds}
            />
          )}
        </DialogContent>
      </Dialog>
    </Stack>
  );
}

const containerSx = { borderTop: 1, borderColor: "divider", mt: 1.5, pt: 1.25 };
const selectedSx = { alignItems: "center", justifyContent: "space-between" };
const headerSx = { alignItems: "center", gap: 1, minHeight: 56, px: 1 };
