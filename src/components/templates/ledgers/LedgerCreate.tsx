"use client";

import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import ChecklistRoundedIcon from "@mui/icons-material/ChecklistRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import { PrimaryActionButton } from "atoms/ui/PrimaryActionButton/PrimaryActionButton";
import { SoftCard } from "atoms/ui/SoftCard";
import { ledgerCreatePageMessages } from "config/ledgerMessages";
import type { LedgerCreateDefaults } from "internal/ledger";
import { ActionFailureFeedback } from "molecules/ui/OperationFeedbackDialogs";
import {
  LedgerBasicInfoFields,
  type LedgerBasicInfoValues,
} from "organisms/ledgers/LedgerBasicInfoFields/LedgerBasicInfoFields";
import { bottomNavigationLayout } from "organisms/navigation/bottomNavigationLayout";
import { SettingsPageLayout } from "templates/layout/SettingsPageLayout";
import { designTokens } from "theme/theme";
import { typographyStyles } from "theme/typographyTokens";
import type {
  LedgerCreateActionState,
  LedgerCreateStateAction,
} from "types/ledgers";

const ledgerCreateText = {
  automaticItems: [
    "默认账户：现金",
    "默认分类：工资收入、其他收入、饮食、住房、出行等",
    "当前用户将成为账本所有者",
    "创建后会自动切换到这个账本",
  ],
  automaticTitle: "系统会自动为你准备",
  create: "创建账本",
  errorTitle: "账本创建失败",
} as const;

const initialLedgerCreateActionState: LedgerCreateActionState = {};

type LedgerCreateTemplateProps = LedgerCreateDefaults & {
  backHref: string;
  createLedgerAction: LedgerCreateStateAction;
};

export function LedgerCreateTemplate({
  backHref,
  createLedgerAction,
  defaults,
}: LedgerCreateTemplateProps) {
  const [actionState, formAction] = useActionState(
    createLedgerAction,
    initialLedgerCreateActionState,
  );
  const [values, setValues] = useState<LedgerBasicInfoValues>(defaults);

  return (
    <SettingsPageLayout
      back={{ href: backHref, label: ledgerCreatePageMessages.back }}
      subtitle={ledgerCreatePageMessages.subtitle}
      title={ledgerCreatePageMessages.title}
    >
      <Stack component="form" action={formAction} spacing={1.6} sx={formSx}>
        <SoftCard sx={formCardSx}>
          <LedgerBasicInfoFields onChange={setValues} values={values} />
        </SoftCard>

        <SoftCard sx={automaticCardSx}>
          <Stack
            direction="row"
            spacing={1.45}
            sx={{ alignItems: "flex-start" }}
          >
            <Box sx={automaticIconSx}>
              <ChecklistRoundedIcon />
            </Box>
            <Stack spacing={1.15} sx={{ flex: 1, minWidth: 0 }}>
              <Typography component="h2" sx={automaticTitleSx}>
                {ledgerCreateText.automaticTitle}
              </Typography>
              <Stack spacing={0.9}>
                {ledgerCreateText.automaticItems.map((item) => (
                  <Stack
                    direction="row"
                    key={item}
                    spacing={0.8}
                    sx={{ alignItems: "flex-start" }}
                  >
                    <Box sx={automaticCheckSx}>
                      <CheckRoundedIcon />
                    </Box>
                    <Typography sx={automaticItemSx}>{item}</Typography>
                  </Stack>
                ))}
              </Stack>
            </Stack>
          </Stack>
        </SoftCard>

        <Stack direction="row" spacing={1.5} sx={actionBarSx}>
          <Button
            component={Link}
            fullWidth
            href={backHref}
            sx={backButtonSx}
            variant="outlined"
          >
            {ledgerCreatePageMessages.back}
          </Button>
          <CreateSubmitButton />
        </Stack>
      </Stack>

      <ActionFailureFeedback
        bottomOffset={bottomNavigationLayout.feedbackBottomOffset}
        state={actionState}
        title={ledgerCreateText.errorTitle}
      />
    </SettingsPageLayout>
  );
}

function CreateSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <PrimaryActionButton disabled={pending} fullWidth type="submit">
      {pending ? (
        <CircularProgress aria-label="创建中" color="inherit" size={22} />
      ) : (
        ledgerCreateText.create
      )}
    </PrimaryActionButton>
  );
}

const formSx = {
  pb: `calc(${bottomNavigationLayout.shellPaddingBottom} + 8px)`,
};

const formCardSx = {
  borderRadius: `${designTokens.radius.xl}px`,
  p: { xs: 1.6, sm: 2 },
};

const automaticCardSx = {
  bgcolor: "var(--user-theme-card-bg)",
  borderRadius: `${designTokens.radius.xl}px`,
  boxShadow: "none",
  p: { xs: 1.7, sm: 2 },
};

const automaticIconSx = {
  alignItems: "center",
  bgcolor: "var(--user-theme-icon-badge-bg)",
  borderRadius: "50%",
  color: "var(--user-theme-icon-badge-color)",
  display: "inline-flex",
  flexShrink: 0,
  height: 48,
  justifyContent: "center",
  width: 48,
  "& .MuiSvgIcon-root": {
    fontSize: 28,
  },
};

const automaticTitleSx = {
  ...typographyStyles.cardTitle,
  fontSize: 18,
  fontWeight: 900,
};

const automaticCheckSx = {
  alignItems: "center",
  bgcolor: "var(--user-theme-action-text)",
  borderRadius: "50%",
  color: "common.white",
  display: "inline-flex",
  flexShrink: 0,
  height: 20,
  justifyContent: "center",
  mt: 0.2,
  width: 20,
  "& .MuiSvgIcon-root": {
    fontSize: 15,
  },
};

const automaticItemSx = {
  color: "text.secondary",
  fontSize: 14,
  lineHeight: 1.6,
};

const actionBarSx = {
  bgcolor: "background.paper",
  bottom: 0,
  borderTop: "1px solid",
  borderColor: "divider",
  mx: { xs: -0.75 },
  px: { xs: 1.5, sm: 2 },
  py: { xs: 1.2, sm: 1.4 },
  position: "sticky",
  zIndex: 1,
};

const backButtonSx = {
  borderColor: "var(--user-theme-action-text)",
  borderRadius: `${designTokens.radius.full}px`,
  color: "text.secondary",
  fontWeight: 900,
  minHeight: 48,
};
