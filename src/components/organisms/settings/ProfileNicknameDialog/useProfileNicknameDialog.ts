"use client";

import {
  useActionState,
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";

import type { UserLedgerDisplayName } from "internal/user";
import type { DisplayNameAction, DisplayNameActionState } from "types/user";

type Step = "edit" | "sync";

type Feedback = { kind: "failure" | "success"; message: string };

const initialState: DisplayNameActionState = {};

function getDefaultSelection(
  ledgers: readonly UserLedgerDisplayName[],
  currentLedgerId: string | null,
): Set<string> {
  // 默认只勾选当前账本。
  return new Set(
    ledgers
      .filter((ledger) => ledger.ledgerId === currentLedgerId)
      .map((ledger) => ledger.ledgerId),
  );
}

/**
 * 修改昵称流程：输入新昵称 → 有账本时询问是否同步到账本昵称 → 提交 Server Action。
 * 失败时停留在当前步骤，便于调整勾选后重试；成功后关闭弹框。
 */
export function useProfileNicknameDialog({
  action,
  currentDisplayName,
  currentLedgerId,
  ledgers,
  onClose,
  open,
}: {
  action: DisplayNameAction;
  currentDisplayName: string;
  currentLedgerId: string | null;
  ledgers: readonly UserLedgerDisplayName[];
  onClose: () => void;
  open: boolean;
}) {
  const [displayName, setDisplayName] = useState(currentDisplayName);
  const [step, setStep] = useState<Step>("edit");
  const [selectedLedgerIds, setSelectedLedgerIds] = useState(() =>
    getDefaultSelection(ledgers, currentLedgerId),
  );
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [wasOpen, setWasOpen] = useState(open);
  const [, startTransition] = useTransition();
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // 每次打开时重置为初始状态（渲染期间根据 props 变化调整 state）。
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setDisplayName(currentDisplayName);
      setStep("edit");
      setSelectedLedgerIds(getDefaultSelection(ledgers, currentLedgerId));
    }
  }

  const trackedAction = useCallback<DisplayNameAction>(
    async (previousState, formData) => {
      const nextState = await action(previousState, formData);

      if (nextState.error) {
        setFeedback({ kind: "failure", message: nextState.error });
      } else if (nextState.success) {
        setFeedback({ kind: "success", message: nextState.success });
        onCloseRef.current();
      }

      return nextState;
    },
    [action],
  );
  const [, formAction, pending] = useActionState(trackedAction, initialState);

  const trimmedDisplayName = displayName.trim();

  function submit(syncLedgerIds: Iterable<string>) {
    const formData = new FormData();
    formData.set("displayName", trimmedDisplayName);
    for (const ledgerId of syncLedgerIds) {
      formData.append("syncLedgerIds", ledgerId);
    }
    startTransition(() => formAction(formData));
  }

  function save() {
    if (!trimmedDisplayName) return;
    if (ledgers.length === 0) {
      submit([]);
      return;
    }
    setStep("sync");
  }

  function toggleLedger(ledgerId: string) {
    setSelectedLedgerIds((current) => {
      const next = new Set(current);
      if (next.has(ledgerId)) {
        next.delete(ledgerId);
      } else {
        next.add(ledgerId);
      }
      return next;
    });
  }

  return {
    canSave: trimmedDisplayName.length > 0 && !pending,
    closeFeedback: () => setFeedback(null),
    confirmSync: () => submit(selectedLedgerIds),
    displayName,
    feedback,
    pending,
    save,
    saveOnlyPersonal: () => submit([]),
    selectAll: () =>
      setSelectedLedgerIds(new Set(ledgers.map((ledger) => ledger.ledgerId))),
    selectNone: () => setSelectedLedgerIds(new Set()),
    selectedLedgerIds,
    setDisplayName,
    step,
    toggleLedger,
    trimmedDisplayName,
    backToEdit: () => setStep("edit"),
  };
}
