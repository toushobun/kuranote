"use client";
import { createContext, useContext } from "react";

/** WizardDialogSwitch 里每个面板提供给内部 WizardDialog 的外框信息。 */
export type WizardDialogSwitchPane = {
  /** 当前显示的面板才把标题栏渲染进共用外框；滑出中的面板不渲染。 */
  active: boolean;
  headerSlot: HTMLElement | null;
  titleId: string;
  /** 共用外框按 Escape 时调用当前面板的关闭处理。 */
  setCloseHandler: (handler: () => void) => void;
};

export const WizardDialogSwitchPaneContext =
  createContext<WizardDialogSwitchPane | null>(null);

export function useWizardDialogSwitchPane() {
  return useContext(WizardDialogSwitchPaneContext);
}
