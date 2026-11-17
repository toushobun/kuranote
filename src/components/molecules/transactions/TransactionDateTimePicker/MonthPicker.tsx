import type { RefObject } from "react";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";

import { transactionDateTimePickerMessages as messages } from "@/constants/transactions";
import { PrimaryActionButton } from "atoms/ui/PrimaryActionButton/PrimaryActionButton";
import { primaryActionButtonNoHoverBrightenSx } from "atoms/ui/PrimaryActionButton/primaryActionButtonSx";
import { designTokens } from "theme/theme";

import {
  PickerColumn,
  pickerOptionSx,
  scrollPickerOptionIntoView,
} from "./PickerColumn";

export function MonthPicker({
  allMonthsOption,
  monthCount = 12,
  submitLabel = "确定",
  month,
  monthRef,
  onMonthChange,
  onSubmit,
  onYearChange,
  year,
  yearOptions,
  yearRef,
}: {
  allMonthsOption?: {
    label: string;
    selected: boolean;
    onSelect: () => void;
    ref: RefObject<HTMLButtonElement | null>;
  };
  monthCount?: number;
  submitLabel?: string;
  month: number;
  monthRef: RefObject<HTMLButtonElement | null>;
  onMonthChange: (value: number) => void;
  onSubmit: () => void;
  onYearChange: (value: number) => void;
  year: number;
  yearOptions: number[];
  yearRef: RefObject<HTMLButtonElement | null>;
}) {
  return (
    <Stack sx={{ flex: 1, minHeight: 0 }}>
      <Stack
        direction="row"
        sx={{
          flex: 1,
          minHeight: 0,
          alignSelf: "center",
          position: "relative",
          maxWidth: 320,
          px: 2,
          width: "100%",
        }}
      >
        <Box
          sx={{
            bgcolor: "action.hover",
            height: 40,
            left: 16,
            pointerEvents: "none",
            position: "absolute",
            right: 16,
            top: "50%",
            transform: "translateY(-50%)",
          }}
        />
        <PickerColumn
          onChange={(value) => {
            if (value === -1) allMonthsOption?.onSelect();
            else onYearChange(value);
          }}
          overlay={false}
        >
          {allMonthsOption ? (
            <Button
              aria-label={allMonthsOption.label}
              aria-pressed={allMonthsOption.selected}
              data-picker-value={-1}
              onClick={(event) => {
                scrollPickerOptionIntoView(event.currentTarget);
                allMonthsOption.onSelect();
              }}
              disableRipple
              ref={allMonthsOption.selected ? allMonthsOption.ref : undefined}
              type="button"
              sx={pickerOptionSx(allMonthsOption.selected)}
            >
              {allMonthsOption.label}
            </Button>
          ) : null}
          {yearOptions.map((option) => (
            <Button
              key={option}
              aria-label={`选择 ${option} 年`}
              data-picker-value={option}
              onClick={(event) => {
                scrollPickerOptionIntoView(event.currentTarget);
                onYearChange(option);
              }}
              disableRipple
              ref={
                option === year && !allMonthsOption?.selected
                  ? yearRef
                  : undefined
              }
              type="button"
              sx={pickerOptionSx(option === year && !allMonthsOption?.selected)}
            >
              {option}年
            </Button>
          ))}
        </PickerColumn>
        <PickerColumn onChange={onMonthChange} overlay={false}>
          {Array.from(
            { length: allMonthsOption?.selected ? 0 : monthCount },
            (_, option) => (
              <Button
                key={option}
                aria-label={`选择 ${option + 1} 月`}
                data-picker-value={option}
                onClick={(event) => {
                  scrollPickerOptionIntoView(event.currentTarget);
                  onMonthChange(option);
                }}
                disableRipple
                ref={option === month ? monthRef : undefined}
                type="button"
                sx={pickerOptionSx(option === month)}
              >
                {option + 1}月
              </Button>
            ),
          )}
        </PickerColumn>
      </Stack>
      <Box sx={{ flexShrink: 0, px: 3, py: 1 }}>
        <PrimaryActionButton
          aria-label={messages.selectMonth}
          fullWidth
          onClick={onSubmit}
          type="button"
          sx={{
            borderRadius: `${designTokens.radius.md}px`,
            fontWeight: 700,
            minHeight: 40,
            ...primaryActionButtonNoHoverBrightenSx,
          }}
        >
          {submitLabel}
        </PrimaryActionButton>
      </Box>
    </Stack>
  );
}
