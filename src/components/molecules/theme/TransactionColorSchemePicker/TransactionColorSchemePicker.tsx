"use client";

import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useActionState, useCallback, useState } from "react";

import {
  transactionColorSchemes,
  type TransactionColorScheme,
} from "internal/user";
import {
  FailureFeedbackDialog,
  SuccessFeedbackDialog,
} from "molecules/ui/OperationFeedbackDialogs";
import { useUserTheme } from "theme/UserThemeProvider";
import { getUserThemeCssVariables } from "theme/userThemeCssVariables";
import { defaultUserThemeKey } from "theme/userThemeTokens";
import type { TransactionColorSchemeAction } from "types/user";

const pickerText = {
  description: "选择支出与收入金额的显示颜色",
  errorTitle: "保存失败",
  successTitle: "保存成功",
  title: "收支颜色",
} as const;

const schemeLabels: Record<TransactionColorScheme, string> = {
  expense_green_income_red: "支出绿 / 收入红",
  expense_red_income_green: "支出红 / 收入绿",
};

type TransactionColorSchemePickerProps = {
  action: TransactionColorSchemeAction;
};

export function TransactionColorSchemePicker({
  action,
}: TransactionColorSchemePickerProps) {
  const { setTransactionColorScheme, transactionColorScheme } = useUserTheme();
  const [isErrorOpen, setIsErrorOpen] = useState(false);
  const [pendingScheme, setPendingScheme] =
    useState<TransactionColorScheme | null>(null);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const trackedAction = useCallback<TransactionColorSchemeAction>(
    async (previousState, formData) => {
      const nextState = await action(previousState, formData).finally(() => {
        setPendingScheme(null);
      });

      if (nextState.error) {
        setIsErrorOpen(true);
      }
      if (nextState.success && nextState.transactionColorScheme) {
        setTransactionColorScheme(nextState.transactionColorScheme);
        setIsSuccessOpen(true);
      }

      return nextState;
    },
    [action, setTransactionColorScheme],
  );
  const [state, formAction, isPending] = useActionState(trackedAction, {});

  return (
    <>
      <Stack spacing={1.25}>
        <Box>
          <Typography component="h3" sx={pickerTitleSx}>
            {pickerText.title}
          </Typography>
          <Typography color="text.secondary" sx={pickerDescriptionSx}>
            {pickerText.description}
          </Typography>
        </Box>

        <Box component="form" action={formAction}>
          <Stack spacing={1}>
            {transactionColorSchemes.map((scheme) => (
              <SchemeOption
                disabled={isPending}
                isPending={isPending && pendingScheme === scheme}
                isSelected={transactionColorScheme === scheme}
                key={scheme}
                onSelect={() => setPendingScheme(scheme)}
                scheme={scheme}
              />
            ))}
          </Stack>
        </Box>
      </Stack>

      <FailureFeedbackDialog
        description={state.error}
        onClose={() => setIsErrorOpen(false)}
        open={isErrorOpen}
        title={pickerText.errorTitle}
      />
      <SuccessFeedbackDialog
        description={state.success}
        onClose={() => setIsSuccessOpen(false)}
        open={isSuccessOpen}
        title={pickerText.successTitle}
      />
    </>
  );
}

function SchemeOption({
  disabled,
  isPending,
  isSelected,
  onSelect,
  scheme,
}: {
  disabled: boolean;
  isPending: boolean;
  isSelected: boolean;
  onSelect: () => void;
  scheme: TransactionColorScheme;
}) {
  const variables = getUserThemeCssVariables(defaultUserThemeKey, scheme);

  return (
    <ButtonBase
      aria-pressed={isSelected}
      disabled={disabled}
      name="transactionColorScheme"
      onClick={onSelect}
      type="submit"
      value={scheme}
      sx={schemeOptionSx(isSelected)}
    >
      <Stack spacing={0.8} sx={{ flex: 1, minWidth: 0 }}>
        <Typography component="span" sx={schemeLabelSx}>
          {schemeLabels[scheme]}
        </Typography>
        <Stack direction="row" spacing={1}>
          <ColorPreview
            background={variables["--user-theme-negative-bg"]}
            color={variables["--user-theme-negative-amount"]}
            label="支出"
          />
          <ColorPreview
            background={variables["--user-theme-income-bg"]}
            color={variables["--user-theme-income-amount"]}
            label="收入"
          />
        </Stack>
      </Stack>

      {isPending ? (
        <CircularProgress aria-label="保存中" size={20} />
      ) : isSelected ? (
        <CheckRoundedIcon aria-label="已选择" color="primary" />
      ) : null}
    </ButtonBase>
  );
}

function ColorPreview({
  background,
  color,
  label,
}: {
  background: string;
  color: string;
  label: string;
}) {
  return (
    <Box
      component="span"
      sx={{
        bgcolor: background,
        borderRadius: 1.5,
        color,
        fontSize: 12,
        fontWeight: 700,
        px: 1,
        py: 0.5,
      }}
    >
      {label}
    </Box>
  );
}

const pickerTitleSx = {
  fontSize: 14,
  fontWeight: 800,
};

const pickerDescriptionSx = {
  fontSize: 12,
  mt: 0.25,
};

const schemeLabelSx = {
  fontSize: 13,
  fontWeight: 700,
};

function schemeOptionSx(isSelected: boolean) {
  return {
    alignItems: "center",
    border: "1px solid",
    borderColor: isSelected
      ? "var(--user-theme-field-card-selected-border)"
      : "divider",
    borderRadius: 2,
    display: "flex",
    gap: 1.25,
    justifyContent: "space-between",
    p: 1.25,
    textAlign: "left",
    width: "100%",
    ...(isSelected
      ? { bgcolor: "var(--user-theme-field-card-selected-bg)" }
      : {}),
  } as const;
}
