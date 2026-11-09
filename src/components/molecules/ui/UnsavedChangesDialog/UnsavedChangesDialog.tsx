import { confirmDialogZIndex } from "theme/zIndex";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import { useId, useLayoutEffect, useRef } from "react";

import { unsavedChangesMessages as m } from "config/unsavedChangesMessages";

export type UnsavedChangesDialogProps = {
  onCancel: () => void;
  onDiscard: () => void;
  onSave?: () => void;
  open: boolean;
  description?: string;
};

export function UnsavedChangesDialog({
  onCancel,
  onDiscard,
  onSave,
  open,
  description,
}: UnsavedChangesDialogProps) {
  const titleId = useId();
  const previousFocus = useRef<HTMLElement | null>(null);
  useLayoutEffect(() => {
    if (open)
      previousFocus.current =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
  }, [open]);
  return (
    <Dialog
      sx={{ zIndex: confirmDialogZIndex }}
      aria-labelledby={titleId}
      disableRestoreFocus
      onClose={onCancel}
      open={open}
      slotProps={{
        transition: {
          onExited: () => {
            // 保留键盘焦点返回，但不让屏幕外的原触发元素把长页重新滚回上方。
            if (previousFocus.current?.isConnected)
              previousFocus.current.focus({ preventScroll: true });
          },
        },
      }}
    >
      <DialogTitle id={titleId}>{m.title}</DialogTitle>
      <DialogContent>
        <DialogContentText>
          {description ?? (onSave ? m.description : m.discardDescription)}
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={[actionsSx, !!onSave && narrowSaveActionsSx]}>
        <Button onClick={onCancel} sx={continueEditingButtonSx}>
          {m.continueEditing}
        </Button>
        <Button onClick={onDiscard} color="error" sx={actionButtonSx}>
          {m.discard}
        </Button>
        {onSave && (
          <Button onClick={onSave} sx={saveButtonSx}>
            {m.saveAndExit}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

// 三个按钮统一为同高的文字按钮，只用颜色和字重区分轻重，避免填充按钮显得又高又胖。
const actionButtonSx = {
  minHeight: 36,
  minWidth: 0,
  px: 1.25,
  py: 0,
} as const;

const continueEditingButtonSx = {
  ...actionButtonSx,
  color: "text.secondary",
} as const;

const saveButtonSx = {
  ...actionButtonSx,
  fontWeight: 900,
} as const;

// 按钮不贴弹框边缘；间距用 gap 统一，取消 MUI 默认的相邻按钮左外边距。
const actionsSx = {
  gap: 0.5,
  pb: 1.75,
  pt: 1,
  px: 2,
  "& > :not(style) ~ :not(style)": {
    ml: 0,
  },
} as const;

// 三个按钮在 320px 视口需要缩小横向内边距，避免文案折行。
const narrowSaveActionsSx = {
  "@media (max-width: 350px)": {
    "& > .MuiButton-root": { px: 0.5 },
  },
} as const;
