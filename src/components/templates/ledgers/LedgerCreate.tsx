"use client";

import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import ChecklistRoundedIcon from "@mui/icons-material/ChecklistRounded";
import ClearRoundedIcon from "@mui/icons-material/ClearRounded";
import CurrencyExchangeRoundedIcon from "@mui/icons-material/CurrencyExchangeRounded";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import { useActionState, useRef, useState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";

import { SoftCard } from "atoms/ui/SoftCard";
import type { LedgerCreateDefaults } from "internal/ledger";
import { FailureFeedbackDialog } from "molecules/ui/OperationFeedbackDialogs";
import { bottomNavigationLayout } from "organisms/navigation/bottomNavigationLayout";
import { PageShell } from "templates/layout/PageShell";
import { fullViewportPageBackgroundSx } from "templates/layout/fullViewportPageBackgroundSx";
import { themeColorTokens, type ThemeColorKey } from "theme/themeColorTokens";
import { typographyStyles } from "theme/typographyTokens";
import {
  ledgerCurrencyOptions,
  ledgerMemberColorOptions,
  type LedgerCreateActionState,
  type LedgerCreateStateAction,
} from "types/ledgers";

const ledgerCreateText = {
  automaticItems: [
    "默认账户：现金",
    "默认分类：工资收入、其他收入、饮食、住房、出行等",
    "当前用户将成为账本所有者",
    "创建后会自动切换到这个账本",
  ],
  automaticTitle: "系统会自动为你准备",
  back: "返回",
  colorHelper: "将用于成员标识与记录展示",
  colorLabel: "我的个性色",
  create: "创建账本",
  currencyLabel: "默认货币",
  displayNameHelper: "这是你在当前账本中的显示昵称",
  displayNameLabel: "我的显示名",
  errorTitle: "账本创建失败",
  ledgerNameLabel: "账本名称",
  subtitle: "创建后将自动准备默认账户和分类，你可以马上开始记账。",
  title: "创建新账本",
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
  const currentErrorKey = actionState.errorKey ?? actionState.error ?? null;
  const [closedErrorKey, setClosedErrorKey] = useState<string | null>(null);
  const isErrorOpen =
    actionState.error !== undefined && currentErrorKey !== closedErrorKey;
  const [ledgerName, setLedgerName] = useState(defaults.ledgerName);
  const [baseCurrency, setBaseCurrency] = useState(defaults.baseCurrency);
  const [displayName, setDisplayName] = useState(defaults.displayName);
  const [displayColor, setDisplayColor] = useState<ThemeColorKey>(
    defaults.displayColor,
  );
  const ledgerNameInputRef = useRef<HTMLInputElement>(null);

  function closeErrorFeedback() {
    setClosedErrorKey(currentErrorKey);
  }

  function clearLedgerName() {
    setLedgerName("");
    ledgerNameInputRef.current?.focus();
  }

  return (
    <>
      <Box
        aria-hidden="true"
        data-testid="ledger-create-page-background"
        sx={fullViewportPageBackgroundSx}
      />
      <PageShell maxWidth="xs" sx={pageShellSx}>
        <Stack component="form" action={formAction} spacing={1.6} sx={formSx}>
          <Stack spacing={1.2} sx={headerSx}>
            <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
              <IconButton
                aria-label={ledgerCreateText.back}
                component={Link}
                href={backHref}
                sx={headerIconButtonSx}
              >
                <ArrowBackRoundedIcon />
              </IconButton>
              <Typography component="h1" sx={pageTitleSx}>
                {ledgerCreateText.title}
              </Typography>
            </Stack>
            <Typography color="text.secondary" sx={pageSubtitleSx}>
              {ledgerCreateText.subtitle}
            </Typography>
          </Stack>

          <SoftCard sx={formCardSx}>
            <Stack spacing={2.1}>
              <CreateField
                htmlFor="create-ledger-name"
                label={ledgerCreateText.ledgerNameLabel}
              >
                <TextField
                  autoComplete="off"
                  fullWidth
                  id="create-ledger-name"
                  inputRef={ledgerNameInputRef}
                  name="ledgerName"
                  onChange={(event) => setLedgerName(event.target.value)}
                  required
                  slotProps={{
                    htmlInput: {
                      maxLength: 100,
                    },
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="清空账本名称"
                            edge="end"
                            onClick={clearLedgerName}
                            size="small"
                            type="button"
                          >
                            <ClearRoundedIcon fontSize="small" />
                          </IconButton>
                        </InputAdornment>
                      ),
                      startAdornment: (
                        <FieldIconAdornment>
                          <HomeRoundedIcon />
                        </FieldIconAdornment>
                      ),
                    },
                  }}
                  value={ledgerName}
                />
              </CreateField>

              <CreateField
                label={ledgerCreateText.currencyLabel}
                labelId="create-ledger-currency-label"
              >
                <TextField
                  fullWidth
                  id="create-ledger-currency"
                  name="baseCurrency"
                  onChange={(event) => setBaseCurrency(event.target.value)}
                  required
                  select
                  slotProps={{
                    input: {
                      startAdornment: (
                        <FieldIconAdornment>
                          <CurrencyExchangeRoundedIcon />
                        </FieldIconAdornment>
                      ),
                    },
                    select: {
                      labelId: "create-ledger-currency-label",
                    },
                  }}
                  value={baseCurrency}
                >
                  {ledgerCurrencyOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              </CreateField>

              <CreateField
                helperText={ledgerCreateText.displayNameHelper}
                htmlFor="create-ledger-display-name"
                label={ledgerCreateText.displayNameLabel}
              >
                <TextField
                  autoComplete="name"
                  fullWidth
                  id="create-ledger-display-name"
                  name="memberDisplayName"
                  onChange={(event) => setDisplayName(event.target.value)}
                  required
                  slotProps={{
                    htmlInput: {
                      maxLength: 100,
                    },
                    input: {
                      startAdornment: (
                        <FieldIconAdornment>
                          <PersonRoundedIcon />
                        </FieldIconAdornment>
                      ),
                    },
                  }}
                  value={displayName}
                />
              </CreateField>

              <Stack spacing={1.1}>
                <Typography component="p" sx={fieldLabelSx}>
                  {ledgerCreateText.colorLabel}
                </Typography>
                <input
                  name="memberDisplayColor"
                  type="hidden"
                  value={displayColor}
                />
                <Stack
                  aria-label={ledgerCreateText.colorLabel}
                  direction="row"
                  role="radiogroup"
                  sx={colorPickerSx}
                >
                  {ledgerMemberColorOptions.map((colorKey) => (
                    <ColorRadio
                      checked={colorKey === displayColor}
                      colorKey={colorKey}
                      key={colorKey}
                      onChange={setDisplayColor}
                    />
                  ))}
                </Stack>
                <Typography color="text.secondary" variant="body2">
                  {ledgerCreateText.colorHelper}
                </Typography>
              </Stack>
            </Stack>
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
              {ledgerCreateText.back}
            </Button>
            <CreateSubmitButton />
          </Stack>
        </Stack>

        <FailureFeedbackDialog
          bottomOffset={feedbackBottomOffset}
          description={actionState.error ?? null}
          onClose={closeErrorFeedback}
          open={isErrorOpen}
          title={ledgerCreateText.errorTitle}
        />
      </PageShell>
    </>
  );
}

function CreateField({
  children,
  helperText,
  htmlFor,
  label,
  labelId,
}: {
  children: ReactNode;
  helperText?: string;
  htmlFor?: string;
  label: string;
  labelId?: string;
}) {
  return (
    <Stack spacing={0.9}>
      {htmlFor ? (
        <Typography
          component="label"
          htmlFor={htmlFor}
          id={labelId}
          sx={fieldLabelSx}
        >
          {label}
        </Typography>
      ) : (
        <Typography component="span" id={labelId} sx={fieldLabelSx}>
          {label}
        </Typography>
      )}
      {children}
      {helperText ? (
        <Typography color="text.secondary" variant="body2">
          {helperText}
        </Typography>
      ) : null}
    </Stack>
  );
}

function FieldIconAdornment({ children }: { children: ReactNode }) {
  return (
    <InputAdornment position="start">
      <Box sx={fieldIconSx}>{children}</Box>
    </InputAdornment>
  );
}

function ColorRadio({
  checked,
  colorKey,
  onChange,
}: {
  checked: boolean;
  colorKey: ThemeColorKey;
  onChange: (colorKey: ThemeColorKey) => void;
}) {
  const colorToken = themeColorTokens[colorKey];

  return (
    <Box component="label" sx={colorOptionLabelSx}>
      <input
        aria-label={colorToken.label}
        checked={checked}
        form=""
        name="memberDisplayColorOption"
        onChange={() => onChange(colorKey)}
        style={visuallyHiddenInputStyle}
        type="radio"
        value={colorKey}
      />
      <Box component="span" sx={colorSwatchSx(colorToken.accent)}>
        <CheckRoundedIcon />
      </Box>
    </Box>
  );
}

function CreateSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      disabled={pending}
      fullWidth
      sx={createButtonSx}
      type="submit"
      variant="contained"
    >
      {pending ? (
        <CircularProgress aria-label="创建中" color="inherit" size={22} />
      ) : (
        ledgerCreateText.create
      )}
    </Button>
  );
}

const pageShellSx = {
  px: { xs: 0.75 },
  py: { xs: 0.75 },
};

const formSx = {
  pb: `calc(${bottomNavigationLayout.shellPaddingBottom} + 8px)`,
};

const headerSx = {
  px: { xs: 0.25, sm: 0.5 },
};

const headerIconButtonSx = {
  color: "text.primary",
  ml: -0.5,
};

const pageTitleSx = {
  ...typographyStyles.pageTitle,
  fontSize: { xs: 28, sm: 30 },
  fontWeight: 900,
};

const pageSubtitleSx = {
  fontSize: { xs: 15, sm: 16 },
  lineHeight: 1.7,
  px: 0.4,
};

const formCardSx = {
  borderRadius: 2,
  p: { xs: 1.6, sm: 2 },
};

const fieldLabelSx = {
  color: "text.primary",
  fontSize: 16,
  fontWeight: 900,
};

const fieldIconSx = {
  alignItems: "center",
  bgcolor: "var(--user-theme-icon-badge-bg)",
  borderRadius: "50%",
  color: "var(--user-theme-icon-badge-color)",
  display: "inline-flex",
  height: 38,
  justifyContent: "center",
  width: 38,
  "& .MuiSvgIcon-root": {
    fontSize: 23,
  },
};

const colorPickerSx = {
  alignItems: "center",
  flexWrap: "wrap",
  gap: { xs: 1.2, sm: 1.45 },
};

const colorOptionLabelSx = {
  cursor: "pointer",
  display: "inline-flex",
  position: "relative",
  "& input:focus-visible + span": {
    outline: "3px solid",
    outlineColor: "primary.light",
    outlineOffset: 3,
  },
  "& input:checked + span": {
    borderColor: "var(--user-theme-action-text)",
    boxShadow: "0 0 0 3px var(--user-theme-icon-badge-bg)",
    transform: "scale(1.06)",
  },
  "& input:checked + span .MuiSvgIcon-root": {
    opacity: 1,
  },
};

const visuallyHiddenInputStyle = {
  height: 1,
  opacity: 0,
  position: "absolute",
  width: 1,
} as const;

function colorSwatchSx(accent: string) {
  return {
    alignItems: "center",
    bgcolor: accent,
    border: "3px solid",
    borderColor: "transparent",
    borderRadius: "50%",
    color: "common.white",
    display: "inline-flex",
    height: 44,
    justifyContent: "center",
    transition: "transform 160ms ease, box-shadow 160ms ease",
    width: 44,
    "& .MuiSvgIcon-root": {
      fontSize: 24,
      opacity: 0,
    },
  } as const;
}

const automaticCardSx = {
  bgcolor: "var(--user-theme-card-bg)",
  borderRadius: 2,
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
  borderRadius: 999,
  color: "text.secondary",
  fontWeight: 900,
  minHeight: 48,
};

const createButtonSx = {
  background: "var(--user-theme-fab-bg)",
  borderRadius: 999,
  color: "var(--user-theme-fab-text)",
  fontWeight: 900,
  minHeight: 48,
  "&:hover": {
    background: "var(--user-theme-fab-bg)",
    filter: "brightness(1.04)",
  },
};

const feedbackBottomOffset = `calc(${bottomNavigationLayout.shellPaddingBottom} + 8px)`;
