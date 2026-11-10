"use client";
import { keyframes } from "@emotion/react";
import Alert from "@mui/material/Alert";
import ButtonBase from "@mui/material/ButtonBase";
import type { RefObject } from "react";

export type ReceiptIssue = {
  id: string;
  message: string;
  onClick: () => void;
};

/** 小票上方的问题提示条：点一下定位到对应位置；再次点保存时闪一下。 */
export function ReceiptIssueAlerts({
  issues,
  pulseCount,
  firstIssueRef,
}: {
  issues: readonly ReceiptIssue[];
  pulseCount: number;
  firstIssueRef: RefObject<HTMLDivElement | null>;
}) {
  return issues.map((issue, index) => (
    <Alert
      key={issue.id}
      data-pulse={pulseCount}
      ref={index === 0 ? firstIssueRef : undefined}
      severity="error"
      sx={
        pulseCount > 0
          ? {
              animation: `${pulseCount % 2 ? issuePulse : issuePulseAlternate} 600ms ease-in-out`,
              "@media (prefers-reduced-motion: reduce)": {
                animation: "none",
              },
            }
          : undefined
      }
    >
      <ButtonBase onClick={issue.onClick} sx={{ textAlign: "left" }}>
        {issue.message}
      </ButtonBase>
    </Alert>
  ));
}

const issuePulse = keyframes`
  0%, 100% { opacity: 1; }
  40% { opacity: 0.55; }
`;

// 交替 animation-name，只有再次提交才重启动画；修改提示文案不重播。
const issuePulseAlternate = keyframes`
  0%, 100% { opacity: 1; }
  40% { opacity: 0.54; }
`;
