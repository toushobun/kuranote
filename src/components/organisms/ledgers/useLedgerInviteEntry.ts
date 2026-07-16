"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  ledgerInviteErrorOperations,
  type LedgerInviteErrorOperation,
} from "config/paths";
import {
  isLedgerInviteRole,
  type LedgerInviteRole,
  type PendingLedgerInvite,
} from "types/ledgers";

type LedgerInviteManagementError = {
  message: string;
  operation: Exclude<LedgerInviteErrorOperation, "create">;
};

type UseLedgerInviteEntryParams = {
  errorKey: string | null;
  errorMessage: string | null;
  errorOperation: LedgerInviteErrorOperation;
  initialToken: string | null;
};

export function useLedgerInviteEntry({
  errorKey,
  errorMessage,
  errorOperation,
  initialToken,
}: UseLedgerInviteEntryParams) {
  const [draftOpen, setDraftOpen] = useState(
    (errorMessage !== null &&
      errorOperation === ledgerInviteErrorOperations.create) ||
      initialToken !== null,
  );
  const [draftRole, setDraftRole] = useState<LedgerInviteRole>("member");
  const [draftToken, setDraftToken] = useState<string | null>(initialToken);
  const [visibleError, setVisibleError] = useState(
    errorOperation === ledgerInviteErrorOperations.create ? errorMessage : null,
  );
  const [managementError, setManagementError] =
    useState<LedgerInviteManagementError | null>(
      errorMessage !== null &&
        errorOperation !== ledgerInviteErrorOperations.create
        ? { message: errorMessage, operation: errorOperation }
        : null,
    );
  const [selectedInvite, setSelectedInvite] =
    useState<PendingLedgerInvite | null>(null);
  const [revokeConfirmOpen, setRevokeConfirmOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const [created, setCreated] = useState(false);
  const [revoked, setRevoked] = useState(false);

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
      const url = new URL(window.location.href);
      const inviteResult = url.searchParams.get("inviteResult");
      const hasInviteError = url.searchParams.has("inviteError");

      if (hashToken) {
        resetTransientFeedback();
        setDraftToken(hashToken);
        setDraftOpen(true);
        setSelectedInvite(null);
        setRevokeConfirmOpen(false);
        setVisibleError(null);
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

      if (hasInviteError) {
        url.searchParams.delete("inviteError");
        url.searchParams.delete("inviteErrorKey");
        url.searchParams.delete("inviteOperation");
      }

      if (hashToken || inviteResult === "revoked" || hasInviteError) {
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
    if (errorMessage === null) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 同路由 Server Action 返回新错误 props 时同步重置旧反馈并展示本次错误。
    resetTransientFeedback();
    if (errorOperation === ledgerInviteErrorOperations.create) {
      setVisibleError(errorMessage);
      setDraftOpen(true);
      setSelectedInvite(null);
      setRevokeConfirmOpen(false);
      return;
    }

    setManagementError({ message: errorMessage, operation: errorOperation });
    setRevokeConfirmOpen(false);
  }, [errorKey, errorMessage, errorOperation, resetTransientFeedback]);

  const draftLink = useInviteLink(draftToken);
  const selectedToken = selectedInvite?.token ?? null;
  const selectedLink = useInviteLink(selectedToken);

  function openNewDraft() {
    setDraftRole("member");
    setDraftToken(null);
    setVisibleError(null);
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
    draftOpen,
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
    setDraftRole,
    visibleError,
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
