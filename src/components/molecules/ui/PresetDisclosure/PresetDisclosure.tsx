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
  return (
    <Collapse
      id={id}
      inert={!expanded}
      in={expanded}
      timeout={timeout}
      easing={easing}
      mountOnEnter
      unmountOnExit
    >
      <Fade in={expanded} timeout={timeout} easing={easing}>
        {children}
      </Fade>
    </Collapse>
  );
}
