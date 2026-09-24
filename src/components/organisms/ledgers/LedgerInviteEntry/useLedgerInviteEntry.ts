"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  isLedgerInviteRole,
  type LedgerInviteActionOperation,
  type LedgerInviteActionState,
  type LedgerInviteRole,
  type PendingLedgerInvite,
} from "types/ledgers";

type LedgerInviteManagementError = {
  message: string;
  operation: LedgerInviteActionOperation;
};

type UseLedgerInviteEntryParams = {
  actionState: LedgerInviteActionState;
  initialToken: string | null;
};

export function useLedgerInviteEntry({
  actionState,
  initialToken,
}: UseLedgerInviteEntryParams) {
  const [draftOpen, setDraftOpen] = useState(initialToken !== null);
  const [draftRole, setDraftRole] = useState<LedgerInviteRole>("member");
  const [draftToken, setDraftToken] = useState<string | null>(initialToken);
  // 草稿目标：为已有待邀请成员生成链接时为其 ID；「邀请成员」新建时为 null，
  // 成功后由 fragment 回填新成员 ID。只用于页面展示与提交字段。
  const [draftPlaceholderId, setDraftPlaceholderId] = useState<string | null>(
    null,
  );
  // 受控输入，避免表单 Action 结束后自动重置导致失败时丢失已填写的名字。
  const [draftName, setDraftName] = useState("");
  const [managementError, setManagementError] =
    useState<LedgerInviteManagementError | null>(null);
  const [selectedInvite, setSelectedInvite] =
    useState<PendingLedgerInvite | null>(null);
  const [revokeConfirmOpen, setRevokeConfirmOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const [created, setCreated] = useState(false);
  const [revoked, setRevoked] = useState(false);
  const consumedErrorKeysRef = useRef(new Set<string>());

  const resetTransientFeedback = useCallback(() => {
    setCopied(false);
    setCopyFailed(false);
    setCreated(false);
    setRevoked(false);
    setManagementError(null);
  }, []);

  useEffect(() => {
    function consumeActionResult() {
      const hashParams = new URLSearchParams(window.location.hash.slice(1));
      const hashRole = hashParams.get("inviteRole");
      const hashToken = hashParams.get("inviteToken");
      // fragment 中的 placeholderId 只用于定位反馈，绑定事实以列表为准。
      const hashPlaceholderId = hashParams.get("placeholderId");
      const url = new URL(window.location.href);
      const inviteResult = url.searchParams.get("inviteResult");

      if (hashToken) {
        resetTransientFeedback();
        setDraftToken(hashToken);
        setDraftPlaceholderId(hashPlaceholderId || null);
        setDraftOpen(true);
        setSelectedInvite(null);
        setRevokeConfirmOpen(false);
        setCreated(true);
      }

      if (isLedgerInviteRole(hashRole)) {
        setDraftRole(hashRole);
      }

      if (inviteResult === "revoked") {
        resetTransientFeedback();
        setSelectedInvite(null);
        setRevokeConfirmOpen(false);
        setRevoked(true);
        url.searchParams.delete("inviteResult");
      }

      if (hashToken || inviteResult === "revoked") {
        window.history.replaceState(null, "", `${url.pathname}${url.search}`);
      }
    }

    consumeActionResult();
    window.addEventListener("hashchange", consumeActionResult);
    window.addEventListener("popstate", consumeActionResult);
    return () => {
      window.removeEventListener("hashchange", consumeActionResult);
      window.removeEventListener("popstate", consumeActionResult);
    };
  }, [resetTransientFeedback]);

  useEffect(() => {
    if (!actionState.error || !actionState.errorKey) return;
    if (consumedErrorKeysRef.current.has(actionState.errorKey)) return;
    consumedErrorKeysRef.current.add(actionState.errorKey);

    resetTransientFeedback();
    const operation = actionState.operation ?? "create";
    setManagementError({ message: actionState.error, operation });

    if (operation === "create" || operation === "invite") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Server Action 返回新错误状态时同步关闭旧反馈并展示本次错误。
      setDraftOpen(true);
      setSelectedInvite(null);
    }
    setRevokeConfirmOpen(false);
  }, [actionState, resetTransientFeedback]);

  const draftLink = useInviteLink(draftToken);
  const selectedToken = selectedInvite?.token ?? null;
  const selectedLink = useInviteLink(selectedToken);

  function openNewDraft(placeholderId: string | null = null) {
    setDraftRole("member");
    setDraftToken(null);
    setDraftPlaceholderId(placeholderId);
    setDraftName("");
    setSelectedInvite(null);
    resetTransientFeedback();
    setDraftOpen(true);
  }

  async function copyLink(link: string) {
    if (!link) return;
    resetTransientFeedback();
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
    } catch {
      setCopyFailed(true);
    }
  }

  return {
    closeCopyFailedFeedback: () => setCopyFailed(false),
    closeCopyFeedback: () => setCopied(false),
    closeCreatedFeedback: () => setCreated(false),
    closeDraft: () => setDraftOpen(false),
    closeInviteDetails: () => setSelectedInvite(null),
    closeManagementError: () => setManagementError(null),
    closeRevokedFeedback: () => setRevoked(false),
    closeRevokeConfirm: () => setRevokeConfirmOpen(false),
    copied,
    copyFailed,
    copyLink,
    created,
    draftLink,
    draftName,
    draftOpen,
    draftPlaceholderId,
    draftRole,
    draftToken,
    managementError,
    openNewDraft,
    openRevokeConfirm: () => setRevokeConfirmOpen(true),
    revoked,
    revokeConfirmOpen,
    selectedInvite,
    selectedLink,
    selectedToken,
    selectInvite: setSelectedInvite,
    setDraftName,
    setDraftRole,
  };
}

function useInviteLink(token: string | null) {
  return useMemo(() => {
    if (!token) return "";
    const path = `/invite/${encodeURIComponent(token)}`;
    if (typeof window === "undefined") return path;
    return `${window.location.origin}${path}`;
  }, [token]);
}
