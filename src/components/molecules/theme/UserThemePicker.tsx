"use client";

import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useActionState, useCallback, useRef, type MouseEvent } from "react";

import { createErrorState } from "internal/shared/adapter/next/actionState";
import { userErrorMessages, type UserThemeKey } from "internal/user";
import { ActionFailureFeedback } from "molecules/ui/OperationFeedbackDialogs";
import { useUserTheme } from "theme/UserThemeProvider";
import { designTokens } from "theme/theme";
import type { ThemeKeyAction } from "types/user";

const pickerText = {
  errorTitle: "保存失败",
} as const;

type UserThemePickerProps = {
  action: ThemeKeyAction;
};

export function UserThemePicker({ action }: UserThemePickerProps) {
  const { themeKey, setThemeKey, themeKeys, tokens } = useUserTheme();
  // 点击时记录切换前的主题，保存失败时回滚到这里。
  const rollbackThemeKeyRef = useRef<UserThemeKey>(themeKey);
  const trackedAction = useCallback<ThemeKeyAction>(
    async (previousState, formData) => {
      try {
        const nextState = await action(previousState, formData);

        if (nextState.error) {
          setThemeKey(rollbackThemeKeyRef.current);
        } else if (nextState.themeKey) {
          setThemeKey(nextState.themeKey);
        }

        return nextState;
      } catch {
        // 网络中断等情况 Server Action 会直接抛出，同样回滚并显示安全文案。
        setThemeKey(rollbackThemeKeyRef.current);
        return createErrorState(userErrorMessages.themeKeyUpdateFailed);
      }
    },
    [action, setThemeKey],
  );
  const [state, formAction, isPending] = useActionState(trackedAction, {});

  const selectThemeKey = (
    event: MouseEvent<HTMLButtonElement>,
    nextThemeKey: UserThemeKey,
  ) => {
    // 保存中或点击当前主题时不提交，避免并发写库导致回滚目标错乱。
    if (isPending || nextThemeKey === themeKey) {
      event.preventDefault();
      return;
    }

    rollbackThemeKeyRef.current = themeKey;
    // 乐观更新：先切换界面，再由表单提交写库。
    setThemeKey(nextThemeKey);
  };

  return (
    <>
      <Stack
        action={formAction}
        aria-label="个人主题"
        component="form"
        direction="row"
        role="listbox"
        sx={{
          gap: 0.75,
          maxWidth: "100%",
          overflowX: "auto",
          pb: 0.25,
          scrollbarWidth: "none",
          "&::-webkit-scrollbar": {
            display: "none",
          },
        }}
      >
        {themeKeys.map((key) => {
          const theme = tokens[key];
          const selected = key === themeKey;

          return (
            <Tooltip key={key} title={theme.name}>
              <ButtonBase
                aria-label={`切换到${theme.name}`}
                aria-selected={selected}
                aria-disabled={isPending}
                name="themeKey"
                onClick={(event) => selectThemeKey(event, key)}
                role="option"
                type="submit"
                value={key}
                sx={{
                  alignItems: "center",
                  bgcolor: "var(--user-theme-card-bg)",
                  border: "2px solid",
                  borderColor: selected
                    ? "var(--user-theme-bottom-nav-active)"
                    : "transparent",
                  borderRadius: `${designTokens.radius.full}px`,
                  boxShadow: "var(--user-theme-card-shadow)",
                  color: selected ? "text.primary" : "text.secondary",
                  display: "inline-flex",
                  flexShrink: 0,
                  gap: 0.75,
                  minHeight: 30,
                  px: 1.25,
                  py: 0.5,
                  transition:
                    "border-color 0.2s ease, box-shadow 0.2s ease, color 0.2s ease",
                }}
              >
                <Box
                  aria-hidden="true"
                  sx={{
                    background: theme.component.buttonPrimaryBg,
                    borderRadius: "50%",
                    flexShrink: 0,
                    height: 13,
                    width: 13,
                  }}
                />
                <Typography
                  component="span"
                  sx={{
                    fontSize: 12,
                    fontWeight: selected ? 700 : 500,
                    lineHeight: 1.2,
                    whiteSpace: "nowrap",
                  }}
                >
                  {theme.name}
                </Typography>
              </ButtonBase>
            </Tooltip>
          );
        })}
      </Stack>

      <ActionFailureFeedback state={state} title={pickerText.errorTitle} />
    </>
  );
}
