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

import { TransactionMonthList } from "../TransactionMonthList/TransactionMonthList";
import { TransactionSearchTemplate } from "templates/transactions/TransactionSearch";
import type {
  TransactionGroupPage,
  TransactionMonthPage,
  TransactionRefundCandidate,
  TransactionSearchPage,
  TransactionTimeGroupViewData,
} from "types/transactions";
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
  onChange: (item: TransactionRefundCandidate | null) => void;
  timeGroupView?: TransactionTimeGroupViewData;
  value: TransactionRefundCandidate | null;
};

export function TransactionRefundLinkPicker({
  loadGroupItemsAction,
  loadMoreGroupsAction,
  loadSearchPageAction,
  onChange,
  timeGroupView,
  value,
}: TransactionRefundLinkPickerProps) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"browse" | "search">("browse");
  const close = () => setOpen(false);
  const select = (item: TransactionRefundCandidate) => {
    onChange(item);
    close();
  };

  return (
    <Stack component="section" spacing={0.75} sx={containerSx}>
      <Typography sx={{ fontWeight: 900 }}>退款关联</Typography>
      {value ? (
        <Stack direction="row" sx={selectedSx}>
          <Stack>
            <Typography sx={{ fontWeight: 800 }} variant="body2">
              {value.categoryName} · ¥{formatNumber(value.amount)}
            </Typography>
            <Typography color="text.secondary" variant="caption">
              剩余可退 ¥{formatNumber(value.remainingRefundableAmount)}
            </Typography>
          </Stack>
          <Button onClick={() => onChange(null)}>取消关联</Button>
        </Stack>
      ) : (
        <Typography color="text.secondary" variant="caption">
          从历史支出明细中选择一条，退款金额等于当前收入金额。
        </Typography>
      )}
      <Button onClick={() => setOpen(true)} variant="outlined">
        {value ? "重新选择退款明细" : "选择退款明细"}
      </Button>

      <Dialog fullScreen onClose={close} open={open}>
        <Stack direction="row" sx={headerSx}>
          <IconButton aria-label="关闭退款关联选择器" onClick={close}>
            <ArrowBackRoundedIcon />
          </IconButton>
          <Typography component="h2" sx={{ fontWeight: 900 }}>
            选择退款明细
          </Typography>
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
                onSelectRefundItem={select}
                refundSelectionMode
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
              initialPage={{ items: [], nextOffset: null, totalCount: 0 }}
              initialQuery=""
              loadSearchPageAction={loadSearchPageAction}
              onClose={close}
              onSelectRefundItem={select}
              refundSelectionMode
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
