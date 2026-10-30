import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { flowMessages as m } from "config/transactionStepFlowMessages";
import {
  receiptPaperSx,
  receiptShadowSx,
} from "organisms/transactions/TransactionConfirmStep/receiptPaperStyles";
import { designTokens } from "theme/theme";

import { NewTransactionVisualFrame } from "./NewTransactionVisualFrame";

const itemRowSkeletonCount = 2;

/**
 * 编辑记账页的加载骨架（#962）：与预填的小票一致——顶栏 + 小票（商家、时间、明细、合计、支付、备注）
 * + 保存与删除按钮。新增记账使用 TransactionStepFlowSkeleton（#943）。
 */
export function EditTransactionSkeleton() {
  return (
    <NewTransactionVisualFrame>
      <Box role="status" aria-label="页面数据加载中" aria-busy="true">
        <Box sx={topBarSx}>
          <Skeleton variant="circular" width={36} height={36} />
          <Typography component="h1" variant="h5" sx={titleSx}>
            {m.editTitle}
          </Typography>
          <Box aria-hidden sx={{ width: 40 }} />
        </Box>
        <Stack spacing={2}>
          <Box sx={receiptShadowSx}>
            <Box sx={receiptPaperSx}>
              <Stack spacing={0.5} sx={{ alignItems: "center", pb: 1.5 }}>
                <Skeleton variant="circular" width={48} height={48} />
                <Skeleton width={120} sx={{ fontSize: "1rem" }} />
                <Skeleton width={96} sx={{ fontSize: "0.875rem" }} />
              </Stack>
              <Stack spacing={1} sx={sectionSx}>
                {Array.from({ length: itemRowSkeletonCount }).map(
                  (_, index) => (
                    <ReceiptRowSkeleton key={index} />
                  ),
                )}
              </Stack>
              <Stack direction="row" sx={[sectionSx, rowSx, { py: 1.5 }]}>
                <Skeleton width={40} />
                <Skeleton width={96} sx={{ fontSize: "1.5rem" }} />
              </Stack>
              <Box sx={sectionSx}>
                <Skeleton width={32} sx={{ fontSize: "0.75rem" }} />
                <ReceiptRowSkeleton />
              </Box>
              <Box sx={sectionSx}>
                <Skeleton width={32} sx={{ fontSize: "0.75rem" }} />
                <Skeleton width="60%" sx={{ fontSize: "0.875rem" }} />
              </Box>
            </Box>
          </Box>
          <Skeleton variant="rounded" height={48} sx={buttonSkeletonSx} />
        </Stack>
        <Skeleton
          variant="rounded"
          height={48}
          sx={[buttonSkeletonSx, { mt: 1.5 }]}
        />
      </Box>
    </NewTransactionVisualFrame>
  );
}

function ReceiptRowSkeleton() {
  return (
    <Stack direction="row" spacing={1.5} sx={rowSx}>
      <Skeleton variant="circular" width={24} height={24} />
      <Skeleton sx={{ flex: 1, fontSize: "0.875rem" }} />
      <Skeleton width={64} sx={{ fontSize: "0.875rem" }} />
    </Stack>
  );
}

const topBarSx = {
  alignItems: "center",
  display: "grid",
  gridTemplateColumns: "40px minmax(0, 1fr) 40px",
  pb: 1.5,
  pt: { xs: 0, sm: 0.5 },
};

const titleSx = {
  color: "text.primary",
  fontSize: "1rem",
  fontWeight: 800,
  letterSpacing: 0,
  lineHeight: 1.25,
  textAlign: "center",
};

const sectionSx = {
  borderTop: "1px dashed",
  borderColor: "divider",
  py: 1,
};

const rowSx = {
  alignItems: "center",
  justifyContent: "space-between",
};

const buttonSkeletonSx = {
  borderRadius: `${designTokens.radius.md}px`,
};
