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

import { summarizeReimbursementAllocationAmounts } from "internal/transaction";
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

type TransactionReimbursementLinkPickerProps = {
  incomeAmount?: string;
  loadGroupItemsAction?: (
    groupKey: string,
    offset: number,
  ) => Promise<TransactionMonthPage>;
  loadMoreGroupsAction?: (offset: number) => Promise<TransactionGroupPage>;
  loadSearchPageAction?: (
    query: string,
    offset: number,
  ) => Promise<TransactionSearchPage>;
  onChange: (item: TransactionRefundCandidate | null) => void;
  timeGroupView?: TransactionTimeGroupViewData;
  value?: TransactionRefundCandidate | null;
};

const emptySearchPage: TransactionSearchPage = {
  items: [],
  nextOffset: null,
  totalCount: 0,
};

export function TransactionReimbursementLinkPicker({
  incomeAmount = "0",
  loadGroupItemsAction,
  loadMoreGroupsAction,
  loadSearchPageAction,
  onChange,
  timeGroupView,
  value = null,
}: TransactionReimbursementLinkPickerProps) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"browse" | "search">("browse");
  const [draftValue, setDraftValue] =
    useState<TransactionRefundCandidate | null>(null);
  const allocation = value
    ? summarizeReimbursementAllocationAmounts(
        incomeAmount,
        value.remainingRefundableAmount,
      )
    : null;

  const openPicker = () => {
    setDraftValue(value);
    setOpen(true);
  };
  const close = () => setOpen(false);
  const confirm = () => {
    onChange(draftValue);
    close();
  };

  return (
    <Stack component="section" spacing={0.75} sx={containerSx}>
      <Typography sx={{ fontWeight: 900 }}>报销关联</Typography>
      {value ? (
        <Stack spacing={0.75}>
          <Typography sx={{ fontWeight: 800 }} variant="body2">
            {value.categoryName} · {getCurrencySymbol(value.accountCurrency)}
            {formatNumber(value.amount)}
          </Typography>
          {allocation ? (
            <Stack spacing={0.35}>
              <AllocationLine
                currency={value.accountCurrency}
                label="收入子项金额"
                value={allocation.incomeAmount}
              />
              <AllocationLine
                currency={value.accountCurrency}
                label="本次实际核销金额"
                value={allocation.allocatedAmount}
              />
              <AllocationLine
                currency={value.accountCurrency}
                label="未核销净收益"
                value={allocation.netIncomeAmount}
              />
            </Stack>
          ) : null}
          <Button onClick={() => onChange(null)}>取消关联</Button>
        </Stack>
      ) : (
        <Typography color="text.secondary" variant="caption">
          可选择一条处于报销流程中的支出；已结清或核销结余后仍可继续关联。
        </Typography>
      )}
      <Button onClick={openPicker} variant="outlined">
        {value ? "重新选择报销明细" : "选择报销明细"}
      </Button>

      <Dialog fullScreen onClose={close} open={open}>
        <Stack direction="row" sx={headerSx}>
          <IconButton aria-label="关闭报销关联选择器" onClick={close}>
            <ArrowBackRoundedIcon />
          </IconButton>
          <Typography component="h2" sx={{ flex: 1, fontWeight: 900 }}>
            选择报销明细
          </Typography>
          <Button onClick={confirm}>完成</Button>
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
                onSelectReimbursementItem={setDraftValue}
                reimbursementSelectionMode
                selectedReimbursementItemId={draftValue?.id ?? null}
                timeGroupView={timeGroupView}
              />
            ) : (
              <Typography color="text.secondary">
                报销候选支出加载失败，请稍后重试。
              </Typography>
            )
          ) : (
            <TransactionSearchTemplate
              errorMessage={null}
              initialPage={emptySearchPage}
              initialQuery=""
              loadSearchPageAction={loadSearchPageAction}
              onClose={close}
              onSelectReimbursementItem={setDraftValue}
              reimbursementSelectionMode
              selectedReimbursementItemId={draftValue?.id ?? null}
            />
          )}
        </DialogContent>
      </Dialog>
    </Stack>
  );
}

function AllocationLine({
  currency,
  label,
  value,
}: {
  currency: string;
  label: string;
  value: string;
}) {
  return (
    <Typography color="text.secondary" variant="caption">
      {label} {getCurrencySymbol(currency)}
      {formatNumber(value)}
    </Typography>
  );
}

const containerSx = { borderTop: 1, borderColor: "divider", mt: 1.5, pt: 1.25 };
const headerSx = { alignItems: "center", gap: 1, minHeight: 56, px: 1 };
