"use client";

import { useEffect, useRef, useState } from "react";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
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
      if (selected <= today) onChange(selected);
    }
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    if (monthRef.current) scrollPickerOptionIntoView(monthRef.current);
    if (yearRef.current) scrollPickerOptionIntoView(yearRef.current);
  }, [open]);

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
        slotProps={{ paper: { sx: { height: 340, p: 1 } } }}
      >
        <MonthPicker
          allMonthsOption={
            searching
              ? {
                  label: m.monthAll,
                  selected: pickerAll,
                  onSelect: () => setPickerAll(true),
                }
              : undefined
          }
          isMonthDisabled={(year, option) =>
            year > thisYear || (year === thisYear && option + 1 > thisMonth)
          }
          month={pickerMonth}
          monthRef={monthRef}
          onMonthChange={(value) => {
            setPickerMonth(value);
            setPickerAll(false);
          }}
          onSubmit={confirm}
          onYearChange={(value) => {
            setPickerYear(value);
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
