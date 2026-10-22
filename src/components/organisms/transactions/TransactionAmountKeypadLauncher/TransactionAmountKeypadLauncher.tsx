"use client";

import { useEffect, useRef, useState } from "react";

import Drawer from "@mui/material/Drawer";
import type { Theme } from "@mui/material/styles";

import { bottomNavigationLayout } from "organisms/navigation/bottomNavigationLayout";
import { amountKeypadZIndex } from "theme/zIndex";

import { TransactionAmountKeypad } from "../TransactionAmountKeypad/TransactionAmountKeypad";

/**
 * 计算器点「确认」时对金额输入框派发的事件，表示「金额已确定」；不确认直接关闭视为取消，不派发。
 * 打开计算器时 Drawer 会抢走焦点，输入框在打开时就已失焦，因此不能用 blur 判断金额确定（#930）。
 */
export const amountInputCommitEvent = "kuranote:amount-input-commit";

export const amountKeypadDrawerSx = {
  zIndex: amountKeypadZIndex,
};

export const amountKeypadDrawerPaperSx = {
  borderRadius: "18px 18px 0 0",
  px: 1.5,
  pt: 1.5,
  pb: (theme: Theme) =>
    `calc(${theme.spacing(1.5)} + ${bottomNavigationLayout.safeAreaPaddingBottom})`,
};

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
    target.dataset.amountInput === "true"
  );
}

function releaseFocusIgnoreAfterNextPaint(callback: () => void) {
  if (typeof window.requestAnimationFrame !== "function") {
    window.setTimeout(callback, 0);
    return;
  }

  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(callback);
  });
}

export function TransactionAmountKeypadLauncher() {
  const ignoreFocusRef = useRef(false);
  const [activeInput, setActiveInput] = useState<HTMLInputElement | null>(null);
  const [currency, setCurrency] = useState<string | undefined>();
  const [value, setValue] = useState("");

  useEffect(() => {
    function handleFocusIn(event: FocusEvent) {
      if (ignoreFocusRef.current) return;
      if (!isAmountInput(event.target)) return;

      setActiveInput(event.target);
      setCurrency(event.target.dataset.amountCurrency || undefined);
      setValue(event.target.value);
    }

    document.addEventListener("focusin", handleFocusIn);

    return () => {
      document.removeEventListener("focusin", handleFocusIn);
    };
  }, []);

  // 不点确认直接关闭（点遮罩等）视为取消：输入框保持打开前的金额。
  function closeKeypad() {
    ignoreFocusRef.current = true;
    activeInput?.blur();
    setActiveInput(null);
    setCurrency(undefined);
    releaseFocusIgnoreAfterNextPaint(() => {
      ignoreFocusRef.current = false;
    });
  }

  // 逐键输入只更新计算器自己的显示，确认时才写入输入框（#930）。
  function handleConfirm(nextValue: string) {
    setValue(nextValue);
    if (activeInput) {
      setInputValue(activeInput, nextValue);
      activeInput.dispatchEvent(new Event(amountInputCommitEvent));
    }
    closeKeypad();
  }

  return (
    <Drawer
      anchor="bottom"
      open={!!activeInput}
      onClose={closeKeypad}
      ModalProps={{ disableRestoreFocus: true }}
      sx={amountKeypadDrawerSx}
      slotProps={{
        paper: {
          sx: amountKeypadDrawerPaperSx,
        },
      }}
    >
      <TransactionAmountKeypad
        currency={currency}
        value={value}
        onChange={setValue}
        onConfirm={handleConfirm}
      />
    </Drawer>
  );
}
