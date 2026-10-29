import Backdrop from "@mui/material/Backdrop";
import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { flowMessages as m } from "config/transactionStepFlowMessages";
import { StepProgress } from "molecules/ui/StepProgress/StepProgress";
import {
  wizardDialogHeaderSx,
  wizardDialogPaperSx,
  wizardDialogTitleRowSx,
  wizardDialogTitleSx,
} from "molecules/ui/WizardDialog/wizardDialogStyles";
import { designTokens } from "theme/theme";

const frequentMerchantSkeletonCount = 8;
const merchantRowSkeletonCount = 4;

/**
 * 记一笔的加载骨架（#943）：与从商家记账的第一屏一致——标题栏 + 4 步进度条 +
 * 搜索框 + 商家分类筛选 + 常用商家网格 + 商家列表。
 */
export function TransactionStepFlowSkeleton() {
  return (
    <Backdrop open sx={backdropSx}>
      <Box
        role="status"
        aria-label="页面数据加载中"
        aria-busy="true"
        sx={paperSx}
      >
        <Box sx={wizardDialogHeaderSx}>
          <Box sx={[wizardDialogTitleRowSx, titleRowSx]}>
            <Skeleton variant="circular" width={36} height={36} />
            <Typography component="h2" sx={wizardDialogTitleSx}>
              {m.title}
            </Typography>
            <Skeleton variant="rounded" width={64} height={30} />
          </Box>
          <StepProgress currentStep={1} label={m.progress} steps={m.steps} />
        </Box>
        <Stack spacing={2} sx={{ p: 2.5 }}>
          <Skeleton variant="rounded" height={40} />
          <Stack direction="row" spacing={1}>
            {[56, 72, 72, 64].map((width, index) => (
              <Skeleton
                key={index}
                variant="rounded"
                width={width}
                height={32}
                sx={chipSx}
              />
            ))}
          </Stack>
          <Skeleton width={72} />
          <Box sx={gridSx}>
            {Array.from({ length: frequentMerchantSkeletonCount }).map(
              (_, index) => (
                <Stack key={index} spacing={1} sx={{ alignItems: "center" }}>
                  <Skeleton variant="circular" width={56} height={56} />
                  <Skeleton width="70%" />
                </Stack>
              ),
            )}
          </Box>
          <Skeleton width={72} />
          <Stack spacing={1.5}>
            {Array.from({ length: merchantRowSkeletonCount }).map(
              (_, index) => (
                <Stack
                  key={index}
                  direction="row"
                  spacing={1.5}
                  sx={{ alignItems: "center" }}
                >
                  <Skeleton variant="circular" width={36} height={36} />
                  <Skeleton sx={{ flex: 1 }} />
                </Stack>
              ),
            )}
          </Stack>
        </Stack>
      </Box>
    </Backdrop>
  );
}

// 手机上与 WizardDialog 一样全屏，桌面端居中。服务端组件的 sx 不能传函数，层级用 theme key。
const backdropSx = { zIndex: "modal" };

const paperSx = {
  bgcolor: "background.paper",
  display: "flex",
  flexDirection: "column",
  width: "100%",
  height: { xs: "100%", sm: wizardDialogPaperSx.height },
  maxWidth: { xs: "none", sm: wizardDialogPaperSx.maxWidth },
  borderRadius: { xs: 0, sm: wizardDialogPaperSx.borderRadius },
  overflow: wizardDialogPaperSx.overflow,
} as const;

const titleRowSx = { gridTemplateColumns: "40px 1fr auto" };

const chipSx = { borderRadius: `${designTokens.radius.full}px`, flexShrink: 0 };

const gridSx = {
  display: "grid",
  gap: 2,
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
};
