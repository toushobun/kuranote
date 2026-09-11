"use client";

import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ButtonBase from "@mui/material/ButtonBase";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useId, useState } from "react";

import { PrimaryActionButton } from "atoms/ui/PrimaryActionButton/PrimaryActionButton";
import { designTokens } from "theme/theme";
import type {
  EmojiIconGroup,
  EmojiIconOption,
} from "../EmojiIconField/EmojiIconField";

export type GroupedIconPickerProps = {
  fieldLabel: string;
  groups: readonly EmojiIconGroup[];
  helperText: string;
  inputName: string;
  onChange: (emoji: string) => void;
  options: readonly EmojiIconOption[];
  value: string;
};

export function GroupedIconPicker({
  fieldLabel,
  groups,
  helperText,
  inputName,
  onChange,
  options,
  value,
}: GroupedIconPickerProps) {
  const id = useId();
  const [draftValue, setDraftValue] = useState<string | null>(null);
  const sections = groups.map((group) => ({
    ...group,
    options: options.filter((option) => option.groupId === group.id),
  }));
  const canConfirm = sections.some((group) =>
    group.options.some((option) => option.emoji === draftValue),
  );
  const closePicker = () => setDraftValue(null);

  return (
    <>
      <input type="hidden" name={inputName} value={value} />
      <Stack spacing={1.5}>
        <Typography component="span" sx={{ fontWeight: 700 }}>
          {fieldLabel}
        </Typography>
        <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
          <Box
            aria-label={`当前${fieldLabel}：${value}`}
            sx={{
              bgcolor: "primary.light",
              borderRadius: `${designTokens.radius.sm}px`,
              p: 1.5,
              typography: "h4",
              flexShrink: 0,
            }}
          >
            {value}
          </Box>
          <Typography
            id={`${id}-helper`}
            color="text.secondary"
            variant="body2"
            sx={{ flex: 1 }}
          >
            {helperText}
          </Typography>
          <Button
            aria-describedby={`${id}-helper`}
            aria-haspopup="dialog"
            onClick={() => setDraftValue(value)}
            type="button"
            variant="outlined"
            sx={{ flexShrink: 0 }}
          >
            选择图标
          </Button>
        </Stack>
      </Stack>
      <Dialog
        fullWidth
        maxWidth="xs"
        slotProps={{ paper: { sx: { maxHeight: "70dvh" } } }}
        open={draftValue !== null}
        onClose={closePicker}
        aria-labelledby={`${id}-title`}
      >
        <DialogTitle id={`${id}-title`}>选择图标</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5}>
            {sections.map((group, index) => (
              <Box
                component="section"
                aria-labelledby={`${id}-group-${index}`}
                key={group.id}
              >
                <Typography
                  component="h3"
                  variant="subtitle1"
                  id={`${id}-group-${index}`}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    mb: 1.5,
                    fontWeight: 700,
                  }}
                >
                  {group.groupIcon && (
                    <Box component="span" aria-hidden="true" sx={{ mr: 1 }}>
                      {group.groupIcon}
                    </Box>
                  )}
                  {group.label}{" "}
                  <Box component="span" sx={{ ml: "auto" }}>
                    {group.options.length}个图标
                  </Box>
                </Typography>
                <Box
                  sx={{
                    display: "grid",
                    gap: 1.25,
                    gridTemplateColumns: {
                      xs: "repeat(5, minmax(0, 1fr))",
                      sm: "repeat(7, minmax(0, 1fr))",
                    },
                  }}
                >
                  {group.options.map((option) => (
                    <ButtonBase
                      key={option.emoji}
                      type="button"
                      aria-label={`选择${option.label}图标`}
                      aria-pressed={draftValue === option.emoji}
                      onClick={() => setDraftValue(option.emoji)}
                      sx={{
                        aspectRatio: "1",
                        border: 2,
                        borderColor:
                          draftValue === option.emoji
                            ? "primary.main"
                            : "divider",
                        bgcolor:
                          draftValue === option.emoji
                            ? "primary.light"
                            : "background.paper",
                        borderRadius: `${designTokens.radius.item}px`,
                        fontSize: "2rem",
                        position: "relative",
                        "&.Mui-focusVisible": {
                          outline: "2px solid",
                          outlineColor: "primary.main",
                          outlineOffset: 2,
                        },
                      }}
                    >
                      {option.emoji}
                      {draftValue === option.emoji && (
                        <CheckRoundedIcon
                          color="primary"
                          fontSize="small"
                          sx={{ position: "absolute", right: 0.5, top: 0.5 }}
                        />
                      )}
                    </ButtonBase>
                  ))}
                </Box>
              </Box>
            ))}
          </Stack>
        </DialogContent>
        <DialogActions disableSpacing sx={{ p: 2 }}>
          <Stack direction="row" spacing={2} sx={{ width: "100%" }}>
            <Button
              fullWidth
              type="button"
              onClick={closePicker}
              variant="outlined"
            >
              取消
            </Button>
            <PrimaryActionButton
              fullWidth
              type="button"
              disabled={!canConfirm}
              onClick={() => {
                if (draftValue !== null && canConfirm) onChange(draftValue);
                closePicker();
              }}
            >
              确定
            </PrimaryActionButton>
          </Stack>
        </DialogActions>
      </Dialog>
    </>
  );
}
