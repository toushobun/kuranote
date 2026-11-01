import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import Link from "next/link";

import { PrimaryActionButton } from "atoms/ui/PrimaryActionButton/PrimaryActionButton";
import { designTokens } from "theme/theme";

type PageFormActionsProps = (
  | { cancelHref: string; onCancel?: never }
  | { cancelHref?: never; onCancel: () => void }
) & {
  cancelLabel: string;
  pending?: boolean;
  pendingLabel: string;
  /** 输入无效等情况下禁止提交（提交中也会禁用）。 */
  submitDisabled?: boolean;
  submitLabel: string;
};

/** 新增 / 编辑页表单底部的「取消 / 保存」圆角按钮组：取消回到来源页，提交中显示加载。 */
export function PageFormActions({
  cancelHref,
  onCancel,
  cancelLabel,
  pending = false,
  pendingLabel,
  submitDisabled = false,
  submitLabel,
}: PageFormActionsProps) {
  return (
    <Stack direction="row" spacing={1.5}>
      <Button
        fullWidth
        {...(onCancel
          ? { onClick: onCancel, type: "button" as const }
          : { component: Link, href: cancelHref })}
        sx={{ borderRadius: `${designTokens.radius.full}px` }}
        variant="outlined"
      >
        {cancelLabel}
      </Button>
      <PrimaryActionButton
        disabled={pending || submitDisabled}
        fullWidth
        sx={submitButtonSx}
        type="submit"
      >
        {pending ? (
          <CircularProgress
            aria-label={pendingLabel}
            color="inherit"
            size={22}
          />
        ) : (
          submitLabel
        )}
      </PrimaryActionButton>
    </Stack>
  );
}

const submitButtonSx = {
  borderRadius: `${designTokens.radius.full}px`,
  fontWeight: 700,
  minHeight: 40,
};
