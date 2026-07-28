"use client";

import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ButtonBase from "@mui/material/ButtonBase";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import InputAdornment from "@mui/material/InputAdornment";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useState } from "react";

import {
  categoryEmojiGroups,
  categoryEmojiOptions,
  type CategoryEmojiGroupId,
} from "config/categoryEmojis";
import { userThemeCardBorderSx } from "theme/userThemeCardSx";

type CategoryIconFieldProps = {
  onChange: (emoji: string) => void;
  value: string;
};

type EmojiGroupFilter = "all" | CategoryEmojiGroupId;

export function CategoryIconField({ onChange, value }: CategoryIconFieldProps) {
  const [open, setOpen] = useState(false);
  const [draftValue, setDraftValue] = useState(value);
  const [groupFilter, setGroupFilter] = useState<EmojiGroupFilter>("all");
  const [query, setQuery] = useState("");

  function openPicker() {
    setDraftValue(value);
    setGroupFilter("all");
    setQuery("");
    setOpen(true);
  }

  const normalizedQuery = query.trim().toLocaleLowerCase();
  const visibleOptions = categoryEmojiOptions.filter((option) => {
    const matchesGroup =
      groupFilter === "all" || option.groupId === groupFilter;
    const matchesQuery =
      normalizedQuery.length === 0 ||
      option.label.toLocaleLowerCase().includes(normalizedQuery) ||
      option.keywords.some((keyword) =>
        keyword.toLocaleLowerCase().includes(normalizedQuery),
      );

    return matchesGroup && matchesQuery;
  });

  return (
    <>
      <input name="iconName" type="hidden" value={value} />
      <Stack spacing={1.5}>
        <Typography component="span" sx={{ fontWeight: 700 }}>
          分类图标
        </Typography>
        <Stack
          direction="row"
          spacing={2}
          sx={{ alignItems: "center", justifyContent: "space-between" }}
        >
          <Box
            aria-label={`当前分类图标：${value}`}
            sx={{
              alignItems: "center",
              bgcolor: "var(--user-theme-icon-badge-bg)",
              ...userThemeCardBorderSx,
              borderRadius: 3,
              display: "flex",
              fontSize: "2.5rem",
              height: 88,
              justifyContent: "center",
              width: 88,
            }}
          >
            {value}
          </Box>
          <Stack spacing={0.5} sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontWeight: 700 }}>选择一个 Emoji</Typography>
            <Typography color="text.secondary" variant="body2">
              从内置图标库中选择，方便在记账时快速识别分类。
            </Typography>
          </Stack>
          <Button onClick={openPicker} type="button" variant="outlined">
            选择图标
          </Button>
        </Stack>
      </Stack>

      <Dialog
        fullWidth
        maxWidth="sm"
        onClose={() => setOpen(false)}
        open={open}
      >
        <DialogTitle>选择图标</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5}>
            <TextField
              fullWidth
              label="搜索图标"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="例如：咖啡、交通、宝宝"
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchRoundedIcon />
                    </InputAdornment>
                  ),
                },
              }}
              value={query}
            />

            <Stack
              direction="row"
              spacing={1}
              sx={{ overflowX: "auto", pb: 0.5 }}
            >
              <Chip
                color={groupFilter === "all" ? "primary" : "default"}
                label="全部"
                onClick={() => setGroupFilter("all")}
                variant={groupFilter === "all" ? "filled" : "outlined"}
              />
              {categoryEmojiGroups.map((group) => (
                <Chip
                  color={groupFilter === group.id ? "primary" : "default"}
                  key={group.id}
                  label={group.label}
                  onClick={() => setGroupFilter(group.id)}
                  variant={groupFilter === group.id ? "filled" : "outlined"}
                />
              ))}
            </Stack>

            {visibleOptions.length > 0 ? (
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
                {visibleOptions.map((option) => {
                  const selected = draftValue === option.emoji;

                  return (
                    <ButtonBase
                      aria-label={`选择${option.label}图标`}
                      aria-pressed={selected}
                      key={`${option.groupId}-${option.emoji}`}
                      onClick={() => setDraftValue(option.emoji)}
                      sx={{
                        aspectRatio: "1 / 1",
                        bgcolor: selected
                          ? "var(--user-theme-icon-badge-bg)"
                          : "background.paper",
                        border: 2,
                        borderColor: selected
                          ? "primary.main"
                          : "var(--user-theme-card-border)",
                        borderRadius: 3,
                        fontSize: "2rem",
                        position: "relative",
                      }}
                    >
                      {option.emoji}
                      {selected ? (
                        <Box
                          sx={{
                            alignItems: "center",
                            bgcolor: "primary.main",
                            borderRadius: "50%",
                            color: "primary.contrastText",
                            display: "flex",
                            height: 20,
                            justifyContent: "center",
                            position: "absolute",
                            right: 4,
                            top: 4,
                            width: 20,
                          }}
                        >
                          <CheckRoundedIcon sx={{ fontSize: 14 }} />
                        </Box>
                      ) : null}
                    </ButtonBase>
                  );
                })}
              </Box>
            ) : (
              <Typography
                color="text.secondary"
                sx={{ py: 4, textAlign: "center" }}
              >
                没有找到匹配的图标。
              </Typography>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} type="button">
            取消
          </Button>
          <Button
            onClick={() => {
              onChange(draftValue);
              setOpen(false);
            }}
            type="button"
            variant="contained"
          >
            确定
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
