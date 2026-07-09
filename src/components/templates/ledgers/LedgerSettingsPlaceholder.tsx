"use client";

import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import ConstructionRoundedIcon from "@mui/icons-material/ConstructionRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Link from "next/link";

import { routePaths } from "config/paths";
import { SoftCard } from "atoms/ui/SoftCard";
import { PageShell } from "templates/layout/PageShell";
import { typographyStyles } from "theme/typographyTokens";

type LedgerSettingsPlaceholderTemplateProps = {
  ledgerName: string;
};

export function LedgerSettingsPlaceholderTemplate({
  ledgerName,
}: LedgerSettingsPlaceholderTemplateProps) {
  return (
    <>
      <Box aria-hidden="true" sx={pageBackgroundSx} />
      <PageShell maxWidth="xs" sx={pageShellSx}>
        <Stack spacing={1.5}>
          <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
            <IconButton
              aria-label="返回"
              component={Link}
              href={routePaths.ledgers}
              sx={headerIconButtonSx}
            >
              <ArrowBackRoundedIcon />
            </IconButton>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography component="h1" sx={pageTitleSx}>
                账本编辑
              </Typography>
              <Typography color="text.secondary" variant="body2">
                {ledgerName}
              </Typography>
            </Box>
          </Stack>

          <SoftCard sx={placeholderCardSx}>
            <Stack
              spacing={1.25}
              sx={{ alignItems: "center", textAlign: "center" }}
            >
              <Box sx={placeholderIconBoxSx}>
                <ConstructionRoundedIcon fontSize="medium" />
              </Box>
              <Stack spacing={0.5}>
                <Typography component="p" sx={placeholderTitleSx}>
                  账本设置页正在准备中
                </Typography>
                <Typography color="text.secondary" variant="body2">
                  这里会在 #385 中实现账本名称、默认货币和成员信息编辑。
                </Typography>
              </Stack>
              <Button
                component={Link}
                href={routePaths.ledgers}
                sx={backButtonSx}
                variant="outlined"
              >
                返回账本管理
              </Button>
            </Stack>
          </SoftCard>
        </Stack>
      </PageShell>
    </>
  );
}

const pageBackgroundSx = {
  bgcolor: "background.paper",
  inset: 0,
  position: "fixed",
  zIndex: -1,
};

const pageShellSx = {
  px: { xs: 0.75 },
  py: { xs: 0.75 },
};

const headerIconButtonSx = {
  color: "text.primary",
  mt: 0.2,
};

const pageTitleSx = {
  ...typographyStyles.pageTitle,
  fontSize: { xs: 24, sm: 26 },
  fontWeight: 900,
};

const placeholderCardSx = {
  borderRadius: 2,
  p: { xs: 2.25, sm: 2.75 },
};

const placeholderIconBoxSx = {
  alignItems: "center",
  bgcolor: "var(--user-theme-icon-badge-bg)",
  borderRadius: "50%",
  color: "var(--user-theme-icon-badge-color)",
  display: "inline-flex",
  height: 56,
  justifyContent: "center",
  width: 56,
};

const placeholderTitleSx = {
  ...typographyStyles.cardTitle,
  fontSize: 18,
  fontWeight: 900,
};

const backButtonSx = {
  borderColor: "var(--user-theme-action-text)",
  borderRadius: 999,
  color: "var(--user-theme-action-text)",
  fontWeight: 800,
  px: 2.5,
};
