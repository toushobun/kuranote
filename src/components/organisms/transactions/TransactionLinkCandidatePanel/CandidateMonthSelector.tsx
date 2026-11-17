"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import { useBackLayer } from "molecules/ui/UnsavedChangesDialog/BackLayerScope";
import { MonthPicker } from "molecules/transactions/TransactionDateTimePicker/MonthPicker";
import { scrollPickerOptionIntoView } from "molecules/transactions/TransactionDateTimePicker/PickerColumn";
import { transactionLinkCandidateMessages as m } from "config/transactionStepFlowMessages";
import {
  changeCandidateMonth,
  currentTokyoCandidateMonth,
} from "./candidateMonth";

export function CandidateMonthSelector({
  month,
  searching,
  onChange,
}: {
  month: string | null;
  searching: boolean;
  onChange: (month: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(0);
  const [pickerMonth, setPickerMonth] = useState(0);
  const [pickerAll, setPickerAll] = useState(false);
  const allMonthsRef = useRef<HTMLButtonElement>(null);
  const yearRef = useRef<HTMLButtonElement>(null);
  const monthRef = useRef<HTMLButtonElement>(null);
  const today = currentTokyoCandidateMonth();
  const [thisYear, thisMonth] = today.split("-").map(Number);
  const yearOptions = Array.from({ length: 51 }, (_, i) => thisYear - i);
  const displayMonth = month ?? today;

  function openPicker() {
    const [year, selectedMonth] = displayMonth.split("-").map(Number);
    setPickerYear(year);
    setPickerMonth(selectedMonth - 1);
    setPickerAll(searching && month === null);
    setOpen(true);
  }

  function confirm() {
    if (pickerAll && searching) onChange(null);
    else {
      const selected = `${pickerYear}-${String(pickerMonth + 1).padStart(2, "0")}`;
      onChange(selected);
    }
    setOpen(false);
  }

  useBackLayer(open, () => setOpen(false), 1);

  const centerSelectedOptions = useCallback(() => {
    const selectedYear = pickerAll ? allMonthsRef.current : yearRef.current;
    if (selectedYear) scrollPickerOptionIntoView(selectedYear, "instant");
    if (!pickerAll && monthRef.current)
      scrollPickerOptionIntoView(monthRef.current, "instant");
  }, [pickerAll]);

  // onEnter 覆盖 Portal 延迟挂载的情况；切换年月时在绘制前同步位置。
  useLayoutEffect(() => {
    if (open) centerSelectedOptions();
  }, [open, pickerYear, pickerMonth, centerSelectedOptions]);

  return (
    <>
      <Stack
        direction="row"
        sx={{
          alignItems: "center",
          justifyContent: "space-between",
          minHeight: 42,
        }}
      >
        {month !== null ? (
          <IconButton
            aria-label={m.monthPrevious}
            onClick={() => onChange(changeCandidateMonth(month, -1))}
            size="small"
          >
            <ChevronLeftRoundedIcon />
          </IconButton>
        ) : null}
        <Button
          aria-label={m.monthSelect}
          onClick={openPicker}
          sx={{
            color: "text.primary",
            fontWeight: 700,
            textTransform: "none",
            flex: 1,
          }}
        >
          {month === null
            ? m.monthAll
            : m.monthLabel(
                Number(month.slice(0, 4)),
                Number(month.slice(5)),
              )}{" "}
          ▾
        </Button>
        {month !== null ? (
          <IconButton
            aria-label={m.monthNext}
            disabled={month >= today}
            onClick={() => onChange(changeCandidateMonth(month, 1))}
            size="small"
          >
            <ChevronRightRoundedIcon />
          </IconButton>
        ) : null}
        {searching && month !== null ? (
          <IconButton
            aria-label={m.monthClearSearch}
            onClick={() => onChange(null)}
            size="small"
          >
            <CloseRoundedIcon />
          </IconButton>
        ) : null}
      </Stack>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullWidth
        maxWidth="xs"
        slotProps={{
          paper: { sx: { height: 280, p: 1 } },
          transition: { onEnter: centerSelectedOptions },
        }}
      >
        <MonthPicker
          allMonthsOption={
            searching
              ? {
                  label: m.monthAll,
                  selected: pickerAll,
                  onSelect: () => setPickerAll(true),
                  ref: allMonthsRef,
                }
              : undefined
          }
          month={pickerMonth}
          monthCount={pickerYear === thisYear ? thisMonth : 12}
          monthRef={monthRef}
          onMonthChange={setPickerMonth}
          onSubmit={confirm}
          onYearChange={(value) => {
            setPickerYear(value);
            if (value === thisYear) {
              setPickerMonth((previous) => Math.min(previous, thisMonth - 1));
            }
            setPickerAll(false);
          }}
          submitLabel={m.monthConfirm}
          year={pickerYear}
          yearOptions={yearOptions}
          yearRef={yearRef}
        />
      </Dialog>
    </>
  );
}
