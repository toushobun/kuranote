"use client";
import { useRef, useState, type Dispatch, type SetStateAction } from "react";
import { flushSync } from "react-dom";
import { flowMessages as m } from "config/transactionStepFlowMessages";
import type { FlowMerchant } from "organisms/transactions/MerchantStep/MerchantStep.types";
import type { TransactionAccountOption } from "types/transactions";
import type { ReceiptCreationData } from "./ReceiptCreationProvider";

type Editor =
  | {
      type: "merchant";
      name?: string;
      onCreated: (value: FlowMerchant) => void;
    }
  | {
      type: "account";
      onCreated: (
        value: TransactionAccountOption,
      ) => Promise<boolean | void> | void;
    };
export function useReceiptCreationState(data: ReceiptCreationData) {
  const [editor, setEditor] = useState<Editor | null>(null);
  const [merchants, setMerchants] = useState<FlowMerchant[]>([]);
  const [accounts, setAccounts] = useState<TransactionAccountOption[]>([]);
  const [message, setMessage] = useState("");
  const pendingRef = useRef(false);
  const [pending, setPending] = useState(false);
  const close = () => {
    if (!pendingRef.current) setEditor(null);
  };
  function trackAction<S>(action: (state: S, data: FormData) => Promise<S>) {
    return async (state: S, data: FormData) => {
      pendingRef.current = true;
      setPending(true);
      try {
        return await action(state, data);
      } finally {
        pendingRef.current = false;
        setPending(false);
      }
    };
  }
  async function completeCreation<T>(
    value: T,
    setOptions: Dispatch<SetStateAction<T[]>>,
    onSelected: (value: T) => Promise<boolean | void> | void,
    success: string,
  ) {
    // 先提交候选项，使小票选择新 ID 时可以解析完整的选项。
    flushSync(() => {
      setOptions((values) => [...values, value]);
      close();
    });
    if ((await onSelected(value)) !== false) setMessage(success);
  }
  return {
    editor,
    merchants,
    accounts,
    message,
    close,
    pending,
    trackAction,
    clearMessage: () => setMessage(""),
    addMerchant: data
      ? (onCreated: (value: FlowMerchant) => void, name?: string) =>
          setEditor({ type: "merchant", onCreated, name })
      : undefined,
    addAccount: data
      ? (onCreated: Extract<Editor, { type: "account" }>["onCreated"]) =>
          setEditor({ type: "account", onCreated })
      : undefined,
    merchantCreated: (merchant: FlowMerchant) => {
      if (editor?.type !== "merchant") return;
      return completeCreation(
        merchant,
        setMerchants,
        editor.onCreated,
        m.merchantCreated(merchant.name),
      );
    },
    accountCreated: async (account: TransactionAccountOption) => {
      if (editor?.type !== "account") return;
      return completeCreation(
        account,
        setAccounts,
        editor.onCreated,
        m.accountCreated(account.name),
      );
    },
  };
}

/** 服务端失效后的候选也可能已经包含新增项，按 ID 合并避免重复。 */
export function mergeReceiptOptions<T extends { id: string }>(
  initial: T[],
  added: T[] = [],
): T[] {
  return [
    ...new Map(
      [...initial, ...added].map((value) => [value.id, value]),
    ).values(),
  ];
}
