"use client";

import {
  useActionState,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";

import { placeholderMemberText } from "config/placeholderMemberText";
import { useConfirmDialog } from "providers/ConfirmDialogProvider/ConfirmDialogProvider";
import type {
  LedgerPlaceholderMemberActionOperation,
  LedgerPlaceholderMemberActionState,
  LedgerPlaceholderMemberActions,
  LedgerPlaceholderMemberStateAction,
  LedgerPlaceholderMemberSummary,
} from "types/ledgers";

type Feedback =
  | { kind: "failure"; message: string; title: string }
  | { kind: "success"; title: string };

const initialState: LedgerPlaceholderMemberActionState = {};

// 非管理者没有写 Action，hook 仍需无条件调用 useActionState。
const readOnlyAction: LedgerPlaceholderMemberStateAction = async (state) =>
  state;

const successTitles: Record<LedgerPlaceholderMemberActionOperation, string> = {
  create: placeholderMemberText.createdTitle,
  delete: placeholderMemberText.deletedTitle,
  rename: placeholderMemberText.renamedTitle,
};

/**
 * 待邀请成员弹框的状态：三个 Server Action 的结果转换为一次性反馈，
 * 创建或删除成功后关闭弹框；删除前通过 useConfirmDialog 二次确认。
 */
export function useLedgerPlaceholderMemberDialog({
  actions,
  ledgerId,
  onClose,
}: {
  actions: LedgerPlaceholderMemberActions | null;
  ledgerId: string;
  onClose: () => void;
}) {
  const [createState, createAction, creating] = useActionState(
    actions?.create ?? readOnlyAction,
    initialState,
  );
  const [renameState, renameAction, renaming] = useActionState(
    actions?.rename ?? readOnlyAction,
    initialState,
  );
  const [deleteState, deleteAction, deleting] = useActionState(
    actions?.delete ?? readOnlyAction,
    initialState,
  );
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [, startTransition] = useTransition();
  const handledKeysRef = useRef(new Set<string>());
  const onCloseRef = useRef(onClose);
  const confirm = useConfirmDialog();

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    for (const state of [createState, renameState, deleteState]) {
      const operation = state.operation;
      if (!operation) continue;

      if (state.error && state.errorKey) {
        if (handledKeysRef.current.has(state.errorKey)) continue;
        handledKeysRef.current.add(state.errorKey);
        // eslint-disable-next-line react-hooks/set-state-in-effect -- Server Action 返回新结果时展示本次反馈。
        setFeedback({
          kind: "failure",
          message: state.error,
          title: placeholderMemberText.failureTitles[operation],
        });
      } else if (state.successKey) {
        if (handledKeysRef.current.has(state.successKey)) continue;
        handledKeysRef.current.add(state.successKey);
        setFeedback({ kind: "success", title: successTitles[operation] });
        if (operation !== "rename") onCloseRef.current();
      }
    }
  }, [createState, deleteState, renameState]);

  async function requestDelete(placeholder: LedgerPlaceholderMemberSummary) {
    const confirmed = await confirm({
      confirmLabel: placeholderMemberText.deleteConfirmLabel,
      description: placeholderMemberText.deleteConfirmDescription(
        placeholder.displayName,
      ),
      title: placeholderMemberText.deleteConfirmTitle,
      tone: "delete",
    });
    if (!confirmed) return;

    const formData = new FormData();
    formData.set("ledgerId", ledgerId);
    formData.set("placeholderId", placeholder.id);
    startTransition(() => deleteAction(formData));
  }

  return {
    closeFeedback: () => setFeedback(null),
    createAction,
    creating,
    deleting,
    feedback,
    renameAction,
    renaming,
    requestDelete,
  };
}
