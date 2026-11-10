"use client";

import Box from "@mui/material/Box";
import Dialog from "@mui/material/Dialog";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import {
  useCallback,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  animateSlideSwitch,
  slideDirectionBetween,
  type SlideDirection,
} from "molecules/ui/transitions/slideSwitchAnimation";
import {
  WizardDialogSwitchPaneContext,
  type WizardDialogSwitchPane,
} from "./wizardDialogSwitchContext";
import {
  enterlessTransitionDuration,
  fullScreenWizardDialogPaperSx,
  wizardDialogPaperSx,
} from "./wizardDialogStyles";

type WizardDialogSwitchProps = {
  /** 当前显示的面板。 */
  activeKey: string;
  /** 面板的并列顺序，决定左右滑的方向。 */
  order: readonly string[];
  /** 渲染一个面板，面板内的 WizardDialog 共用本外框。 */
  renderPane: (key: string) => ReactNode;
};

type Exiting = { key: string; direction: SlideDirection };

/**
 * 同级面板切换的共用外框（#1055）：只开一个弹框，标题栏由当前面板的 WizardDialog 填入、原地不动；
 * 内容区按并列顺序左右滑动，滑出中的旧面板不可操作、对读屏隐藏，动画结束后卸载。
 */
export function WizardDialogSwitch({
  activeKey,
  order,
  renderPane,
}: WizardDialogSwitchProps) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const titleId = useId();
  const [headerSlot, setHeaderSlot] = useState<HTMLElement | null>(null);
  const closeHandler = useRef<() => void>(() => {});
  const panes = useRef(new Map<string, HTMLElement>());
  const [shownKey, setShownKey] = useState(activeKey);
  const [exiting, setExiting] = useState<Exiting | null>(null);
  if (activeKey !== shownKey) {
    setShownKey(activeKey);
    setExiting({
      key: shownKey,
      direction: slideDirectionBetween(order, shownKey, activeKey),
    });
  }

  useLayoutEffect(() => {
    if (!exiting) return;
    const enter = panes.current.get(shownKey);
    const exit = panes.current.get(exiting.key);
    if (!enter || !exit) return;
    let current = true;
    const timing = {
      duration: theme.transitions.duration.standard,
      easing: theme.transitions.easing.easeOut,
    };
    // 标题栏原地不动，只有标题文字淡入。
    headerSlot
      ?.querySelector("h2")
      ?.animate?.([{ opacity: 0 }, { opacity: 1 }], timing);
    void animateSlideSwitch({
      enter,
      exit,
      direction: exiting.direction,
      ...timing,
    }).then(() => {
      if (current) setExiting(null);
    });
    return () => {
      current = false;
    };
  }, [exiting, headerSlot, shownKey, theme]);

  const setCloseHandler = useCallback((handler: () => void) => {
    closeHandler.current = handler;
  }, []);
  const activePane = useMemo<WizardDialogSwitchPane>(
    () => ({ active: true, headerSlot, titleId, setCloseHandler }),
    [headerSlot, setCloseHandler, titleId],
  );
  const exitingPane = useMemo<WizardDialogSwitchPane>(
    () => ({ ...activePane, active: false }),
    [activePane],
  );
  // 旧面板排在前面，新面板推入时盖在上面。
  const keys = exiting ? [exiting.key, shownKey] : [shownKey];

  return (
    <Dialog
      aria-labelledby={titleId}
      fullScreen={fullScreen}
      fullWidth
      maxWidth={false}
      onClose={() => closeHandler.current()}
      open
      transitionDuration={enterlessTransitionDuration(theme)}
      slotProps={{
        paper: {
          sx: fullScreen ? fullScreenWizardDialogPaperSx : wizardDialogPaperSx,
        },
      }}
    >
      <Box ref={setHeaderSlot} sx={{ flexShrink: 0 }} />
      <Box sx={viewportSx}>
        {keys.map((key) => {
          const active = key === shownKey;
          return (
            <Box
              key={key}
              ref={(element: HTMLElement | null) => {
                if (element) panes.current.set(key, element);
                else panes.current.delete(key);
              }}
              aria-hidden={active ? undefined : true}
              inert={!active}
              data-testid={`wizard-dialog-switch-pane-${key}`}
              sx={active ? activePaneSx : exitingPaneSx}
            >
              <WizardDialogSwitchPaneContext
                value={active ? activePane : exitingPane}
              >
                {renderPane(key)}
              </WizardDialogSwitchPaneContext>
            </Box>
          );
        })}
      </Box>
    </Dialog>
  );
}

const paneSx = {
  // 面板沿用弹框纸面底色，推入时盖住下面的旧面板。
  background: "inherit",
  display: "flex",
  flexDirection: "column",
  minHeight: 0,
} as const;

const viewportSx = {
  background: "inherit",
  display: "flex",
  flex: 1,
  flexDirection: "column",
  minHeight: 0,
  overflow: "hidden",
  position: "relative",
} as const;

const activePaneSx = { ...paneSx, flex: 1, position: "relative" } as const;
const exitingPaneSx = {
  ...paneSx,
  inset: 0,
  pointerEvents: "none",
  position: "absolute",
} as const;
