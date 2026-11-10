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

/** 面板实例：同一个 key 每次重新进入都是新实例（id 不同），不复用滑出中的旧面板。 */
type PaneInstance = { key: string; id: number };
type Exiting = PaneInstance & { direction: SlideDirection };

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
  const panes = useRef(new Map<number, HTMLElement>());
  const [shown, setShown] = useState<PaneInstance>({ key: activeKey, id: 0 });
  const [exiting, setExiting] = useState<Exiting | null>(null);
  if (activeKey !== shown.key) {
    // 滑出中又切回同一方式时，旧实例直接卸载、新建一份：已放弃的表单不会复活，
    // 离开守卫也随新实例重新登记。
    setShown({ key: activeKey, id: shown.id + 1 });
    setExiting({
      ...shown,
      direction: slideDirectionBetween(order, shown.key, activeKey),
    });
  }

  useLayoutEffect(() => {
    if (!exiting) return;
    const enter = panes.current.get(shown.id);
    const exit = panes.current.get(exiting.id);
    if (!enter || !exit) return;
    let current = true;
    const timing = {
      duration: theme.transitions.duration.standard,
      easing: theme.transitions.easing.easeOut,
    };
    // 标题栏原地不动，只有标题文字淡入。
    const titleFade = headerSlot
      ?.querySelector("h2")
      ?.animate?.([{ opacity: 0 }, { opacity: 1 }], timing);
    const slide = animateSlideSwitch({
      enter,
      exit,
      direction: exiting.direction,
      ...timing,
    });
    void slide.finished.then(() => {
      if (current) setExiting(null);
    });
    // 动画未结束又切换时取消本轮动画，避免 fill 残留的位移或透明度。
    return () => {
      current = false;
      titleFade?.cancel();
      slide.cancel();
    };
  }, [exiting, headerSlot, shown.id, theme]);

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
  const instances = exiting ? [exiting, shown] : [shown];

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
        {instances.map(({ key, id }) => {
          const active = id === shown.id;
          return (
            <Box
              key={id}
              ref={(element: HTMLElement | null) => {
                if (element) panes.current.set(id, element);
                else panes.current.delete(id);
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
