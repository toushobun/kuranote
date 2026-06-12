"use client";

import { useEffect, useState } from "react";

import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import Typography from "@mui/material/Typography";

import { TransactionAmountKeypad } from "./TransactionAmountKeypad";

function setInputValue(input: HTMLInputElement, value: string) {
  const valueSetter = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    "value",
  )?.set;

  valueSetter?.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

function isAmountInput(target: EventTarget | null): target is HTMLInputElement {
  return (
    target instanceof HTMLInputElement &&
    target.type === "text" &&
    target.placeholder === "0" &&
    !!target.closest("#new-transaction-form")
  );
}

export function TransactionAmountKeypadLauncher() {
  const [activeInput, setActiveInput] = useState<HTMLInputElement | null>(null);
  const [value, setValue] = useState("");

  useEffect(() => {
    function handleFocusIn(event: FocusEvent) {
      if (!isAmountInput(event.target)) return;

      setActiveInput(event.target);
      setValue(event.target.value);
    }

    document.addEventListener("focusin", handleFocusIn);

    return () => {
      document.removeEventListener("focusin", handleFocusIn);
    };
  }, []);

  function handleChange(nextValue: string) {
    setValue(nextValue);
    if (activeInput) setInputValue(activeInput, nextValue);
  }

  function handleConfirm(nextValue: string) {
    handleChange(nextValue);
    setActiveInput(null);
  }

  return (
    <Drawer
      anchor="bottom"
      open={!!activeInput}
      onClose={() => setActiveInput(null)}
      slotProps={{
        paper: {
          sx: {
            borderRadius: "16px 16px 0 0",
            p: 2,
          },
        },
      }}
    >
      <Box sx={{ mb: 1.5 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          金额输入
        </Typography>
        <Typography color="text.secondary" variant="body2">
          支持数字、小数点、删除、清空和简单加减。
        </Typography>
      </Box>
      <TransactionAmountKeypad
        value={value}
        onChange={handleChange}
        onConfirm={handleConfirm}
      />
    </Drawer>
  );
}
