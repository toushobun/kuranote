"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { ledgerSetupLoadErrorMessages } from "internal/ledger";
import type {
  LedgerSetupWizardLauncherActions,
  LedgerSetupWizardView,
  LedgerSetupWizardViewActionState,
} from "types/ledgers";

type LauncherState =
  | { status: "closed" }
  | { status: "loading" }
  | { message: string; status: "error" }
  | { status: "ready"; view: LedgerSetupWizardView };

/**
 * 打开创建账本向导：打开时才通过 Server Action 读取向导数据，
 * 读取中 / 失败在弹框内显示；关闭向导后刷新页面，使入口页的创建中进度与账本列表更新。
 * 入口页把 openWizard 交给按钮，并把返回值整体传给 LedgerSetupWizardLauncher 渲染弹框。
 */
export function useLedgerSetupWizardLauncher(
  actions: LedgerSetupWizardLauncherActions,
) {
  const router = useRouter();
  const [state, setState] = useState<LauncherState>({ status: "closed" });
  // 只采用最后一次发起的读取结果；读取中关闭弹框后，迟到的结果不再打开向导。
  const latestRequestRef = useRef(0);

  async function openWizard() {
    const requestId = ++latestRequestRef.current;
    setState({ status: "loading" });

    let result: LedgerSetupWizardViewActionState;

    try {
      result = await actions.loadWizard();
    } catch {
      // 网络断开等导致 Server Action 本身调用失败。
      result = { error: ledgerSetupLoadErrorMessages.loadFailed };
    }

    if (requestId !== latestRequestRef.current) return;

    setState(
      result.view
        ? { status: "ready", view: result.view }
        : {
            message: result.error ?? ledgerSetupLoadErrorMessages.loadFailed,
            status: "error",
          },
    );
  }

  /** 关闭读取中 / 读取失败的弹框。 */
  function cancel() {
    latestRequestRef.current += 1;
    setState({ status: "closed" });
  }

  /** 关闭向导：创建中进度或已完成的账本可能已变化，刷新入口页。 */
  function closeWizard() {
    setState({ status: "closed" });
    router.refresh();
  }

  return {
    cancel,
    closeWizard,
    openWizard: () => void openWizard(),
    state,
    wizardActions: actions.wizard,
  };
}
