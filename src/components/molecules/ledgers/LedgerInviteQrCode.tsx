"use client";

import QrCode2RoundedIcon from "@mui/icons-material/QrCode2Rounded";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useMemo } from "react";

import { createQrMatrix, qrMatrixToPath } from "lib/qr/qrCode";
import { designTokens } from "theme/theme";

const qrMargin = 4;

export type LedgerInviteQrCodeProps = {
  emptyMessage?: string;
  ledgerName: string;
  link: string;
};

export function LedgerInviteQrCode({
  emptyMessage = "生成邀请链接后将在这里显示二维码",
  ledgerName,
  link,
}: LedgerInviteQrCodeProps) {
  const qrData = useMemo(() => {
    if (!link) return null;

    try {
      const matrix = createQrMatrix(link);
      return {
        path: qrMatrixToPath(matrix, qrMargin),
        size: matrix.length + qrMargin * 2,
      };
    } catch {
      return null;
    }
  }, [link]);

  if (!qrData) {
    return (
      <Stack role="status" spacing={0.75} sx={emptyContainerSx}>
        <QrCode2RoundedIcon aria-hidden="true" sx={emptyIconSx} />
        <Typography color="text.secondary" sx={centeredTextSx} variant="body2">
          {emptyMessage}
        </Typography>
      </Stack>
    );
  }

  return (
    <Stack spacing={1} sx={{ alignItems: "center" }}>
      <Box sx={qrFrameSx}>
        <Box
          aria-label={`账本邀请二维码，${ledgerName}`}
          component="svg"
          data-qr-value={link}
          role="img"
          shapeRendering="crispEdges"
          sx={qrSvgSx}
          viewBox={`0 0 ${qrData.size} ${qrData.size}`}
        >
          <title>{`${ledgerName}的邀请二维码`}</title>
          <rect fill="#FFFFFF" height="100%" width="100%" />
          <path d={qrData.path} fill="currentColor" />
        </Box>
      </Box>
      <Stack spacing={0.25} sx={{ alignItems: "center" }}>
        <Typography sx={ledgerNameSx} variant="body2">
          {ledgerName}
        </Typography>
        <Typography
          color="text.secondary"
          sx={centeredTextSx}
          variant="caption"
        >
          使用手机相机扫码，打开邀请确认页
        </Typography>
      </Stack>
    </Stack>
  );
}

const qrFrameSx = {
  bgcolor: "common.white",
  border: "1px solid",
  borderColor: "divider",
  borderRadius: `${designTokens.radius.xl}px`,
  boxShadow: 2,
  color: "common.black",
  maxWidth: 224,
  p: 1.5,
  width: "min(100%, 224px)",
};

const qrSvgSx = {
  display: "block",
  height: "auto",
  width: "100%",
};

const emptyContainerSx = {
  alignItems: "center",
  bgcolor: "background.default",
  border: "1px dashed",
  borderColor: "divider",
  borderRadius: `${designTokens.radius.xl}px`,
  justifyContent: "center",
  minHeight: 168,
  px: 2,
  py: 2.5,
};

const emptyIconSx = {
  color: "text.disabled",
  fontSize: 56,
};

const centeredTextSx = {
  textAlign: "center",
};

const ledgerNameSx = {
  fontWeight: 700,
  textAlign: "center",
};
