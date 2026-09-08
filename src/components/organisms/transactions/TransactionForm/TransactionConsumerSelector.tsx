"use client";

import { useMemo, useState } from "react";

import Autocomplete from "@mui/material/Autocomplete";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";

import { useEditTransactionDirty } from "organisms/transactions/EditTransactionDirtyContext/EditTransactionDirtyContext";
import { designTokens } from "theme/theme";
import {
  getStableFallbackThemeColorKey,
  themeColorTokens,
} from "theme/themeColorTokens";
import { userThemeCardBorderSx } from "theme/userThemeCardSx";
import type { TransactionConsumerOption } from "types/transactions";

import { useTransactionConsumers } from "./TransactionConsumerContext";

export function TransactionConsumerSelector() {
  const context = useTransactionConsumers();
  const markEditDirty = useEditTransactionDirty();
  const options = context?.consumerOptions ?? [];
  const recorderUserId = context?.recorderUserId ?? "";
  const initialIds = useMemo(() => {
    const configured = context?.initialConsumerUserIds;
    if (configured !== undefined) return [...new Set(configured)];
    return recorderUserId ? [recorderUserId] : [];
  }, [context?.initialConsumerUserIds, recorderUserId]);
  const initialValue = useMemo(
    () => options.filter((option) => initialIds.includes(option.id)),
    [initialIds, options],
  );
  const [selectedConsumers, setSelectedConsumers] =
    useState<TransactionConsumerOption[]>(initialValue);
  const [expanded, setExpanded] = useState(
    () => !isDefaultConsumerSelection(initialIds, recorderUserId),
  );

  if (!context || options.length <= 1) return null;

  const recorderOption = options.find((option) => option.id === recorderUserId);

  return (
    <Box sx={{ px: 0.25 }}>
      {selectedConsumers.map((consumer) => (
        <input
          key={consumer.id}
          name="consumerUserId"
          type="hidden"
          value={consumer.id}
        />
      ))}

      {expanded ? (
        <Autocomplete
          disableCloseOnSelect
          getOptionLabel={(option) => option.name}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          multiple
          onChange={(_event, value) => {
            markEditDirty?.();
            setSelectedConsumers(
              value.length > 0 ? value : recorderOption ? [recorderOption] : [],
            );
          }}
          options={options}
          renderOption={(props, option) => {
            const { key, ...optionProps } = props;
            const token = getConsumerColorToken(option);
            return (
              <Box
                component="li"
                key={key}
                {...optionProps}
                sx={{ alignItems: "center", display: "flex", gap: 1 }}
              >
                <Avatar
                  sx={{
                    bgcolor: token.chipBackground,
                    border: `1px solid ${token.chipBorder}`,
                    color: token.chipText,
                    fontSize: 12,
                    fontWeight: 800,
                    height: 24,
                    width: 24,
                  }}
                >
                  {getConsumerInitial(option.name)}
                </Avatar>
                <span>{option.name}</span>
              </Box>
            );
          }}
          renderValue={(value, getItemProps) =>
            value.map((option, index) => {
              const { key, ...itemProps } = getItemProps({ index });
              const token = getConsumerColorToken(option);
              return (
                <Chip
                  {...itemProps}
                  avatar={
                    <Avatar
                      sx={{
                        bgcolor: `${token.chipBackground} !important`,
                        color: `${token.chipText} !important`,
                        fontSize: 11,
                        fontWeight: 800,
                      }}
                    >
                      {getConsumerInitial(option.name)}
                    </Avatar>
                  }
                  key={key}
                  label={option.name}
                  size="small"
                  sx={{
                    bgcolor: token.chipBackground,
                    borderColor: token.chipBorder,
                    color: token.chipText,
                    fontWeight: 700,
                  }}
                  variant="outlined"
                />
              );
            })
          }
          renderInput={(params) => (
            <TextField
              {...params}
              helperText="支持多选；清空选择时会恢复为记账人本人。"
              label="消费者"
              size="small"
            />
          )}
          value={selectedConsumers}
        />
      ) : (
        <Button
          onClick={() => setExpanded(true)}
          type="button"
          variant="text"
          sx={{
            ...userThemeCardBorderSx,
            borderRadius: `${designTokens.radius.lg}px`,
            color: "var(--user-theme-action-text)",
            fontSize: "0.9rem",
            fontWeight: 800,
            minHeight: 38,
            width: "100%",
          }}
        >
          + 指定消费者
        </Button>
      )}
    </Box>
  );
}

function isDefaultConsumerSelection(userIds: string[], recorderUserId: string) {
  return userIds.length === 1 && userIds[0] === recorderUserId;
}

function getConsumerColorToken(option: TransactionConsumerOption) {
  return themeColorTokens[
    option.color ?? getStableFallbackThemeColorKey(option.id)
  ];
}

function getConsumerInitial(name: string) {
  return name.trim().slice(0, 1) || "?";
}
