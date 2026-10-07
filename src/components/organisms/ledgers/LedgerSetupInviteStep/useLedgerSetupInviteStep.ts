"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ledgerSetupLoadErrorMessages } from "internal/ledger";
import type { LedgerSetupWizardActions } from "organisms/ledgers/LedgerSetupWizard/ledgerSetupWizardStepTypes";
import type {
  LedgerInviteStateAction,
  LedgerPlaceholderMemberActions,
  LedgerPlaceholderMemberStateAction,
  LedgerSetupInviteMembers,
  LedgerSetupInviteMembersActionState,
} from "types/ledgers";

type InviteMembersStatus = "error" | "loaded" | "loading";

type UseLedgerSetupInviteStepOptions = {
  actions: Pick<
    LedgerSetupWizardActions,
    "createInvite" | "loadInviteMembers" | "placeholderMemberActions"
  >;
  ledgerId: string;
};

/**
 * 第 6 步「邀请成员」的数据读取。向导是客户端弹框，邀请相关 Action 的 revalidate
 * 不会刷新这里的状态，因此在邀请 / 改名 / 删除结束后重新读取列表。
 */
export function useLedgerSetupInviteStep({
  actions,
  ledgerId,
}: UseLedgerSetupInviteStepOptions) {
  const [status, setStatus] = useState<InviteMembersStatus>("loading");
  // 最近一次读取成功的列表；重新读取失败时保留，完成页的待邀请成员数以此为准。
  const [members, setMembers] = useState<LedgerSetupInviteMembers | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // 只采用最后一次发起的读取结果，避免较慢的旧请求覆盖新列表。
  const latestRequestRef = useRef(0);
  const { createInvite, loadInviteMembers, placeholderMemberActions } = actions;

  const reload = useCallback(async () => {
    const requestId = ++latestRequestRef.current;
    let state: LedgerSetupInviteMembersActionState;

    try {
      state = await loadInviteMembers({ ledgerId });
    } catch {
      // 网络断开等导致 Server Action 本身调用失败。
      state = { error: ledgerSetupLoadErrorMessages.inviteMembersLoadFailed };
    }

    if (requestId !== latestRequestRef.current) return;

    if (state.members) {
      setMembers(state.members);
      setStatus("loaded");
      return;
    }

    setErrorMessage(
      state.error ?? ledgerSetupLoadErrorMessages.inviteMembersLoadFailed,
    );
    setStatus("error");
  }, [ledgerId, loadInviteMembers]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 进入步骤时读取服务端数据，状态在请求完成后才更新。
    void reload();
  }, [reload]);

  // 邀请成员可能部分成功（待邀请成员已创建、链接生成失败），因此无论结果都重新读取。
  const inviteAction = useCallback<LedgerInviteStateAction>(
    async (previousState, formData) => {
      const state = await createInvite(previousState, formData);
      void reload();
      return state;
    },
    [createInvite, reload],
  );

  const wrappedPlaceholderMemberActions =
    useMemo<LedgerPlaceholderMemberActions>(() => {
      function withReload(
        action: LedgerPlaceholderMemberStateAction,
      ): LedgerPlaceholderMemberStateAction {
        return async (previousState, formData) => {
          const state = await action(previousState, formData);
          if (state.successKey) void reload();
          return state;
        };
      }

      return {
        delete: withReload(placeholderMemberActions.delete),
        rename: withReload(placeholderMemberActions.rename),
      };
    }, [placeholderMemberActions, reload]);

  return {
    errorMessage,
    inviteAction,
    members,
    placeholderMemberActions: wrappedPlaceholderMemberActions,
    placeholderMemberCount: members?.placeholderMembers.length ?? 0,
    status,
    retry() {
      setStatus("loading");
      void reload();
    },
  };
}
