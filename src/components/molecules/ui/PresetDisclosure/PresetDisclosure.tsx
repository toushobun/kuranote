"use client";

import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import Collapse from "@mui/material/Collapse";
import Fade from "@mui/material/Fade";
import useMediaQuery from "@mui/material/useMediaQuery";
import type { ReactElement } from "react";
import { designTokens } from "theme/theme";

const { duration, easing } = designTokens.motion.presetDisclosure;

export function PresetDisclosureChevron({ expanded }: { expanded: boolean }) {
  const phase = expanded ? "enter" : "exit";
  return (
    <ChevronRightRoundedIcon
      aria-hidden
      fontSize="small"
      sx={{
        color: "text.secondary",
        transform: expanded ? "rotate(90deg)" : undefined,
        transition: `transform ${duration[phase]}ms ${easing[phase]}`,
        "@media (prefers-reduced-motion: reduce)": { transition: "none" },
      }}
    />
  );
}

export function PresetDisclosurePanel({
  children,
  expanded,
  id,
}: {
  children: ReactElement;
  expanded: boolean;
  id: string;
}) {
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const timeout = reducedMotion ? 0 : duration;
  // 首次展开时才挂载；收起后保留（inert + 隐藏），避免再次展开时重建整列行造成卡顿。
  return (
    <Collapse
      id={id}
      inert={!expanded}
      in={expanded}
      timeout={timeout}
      easing={easing}
      mountOnEnter
    >
      <Fade in={expanded} timeout={timeout} easing={easing}>
        {children}
      </Fade>
    </Collapse>
  );
}
