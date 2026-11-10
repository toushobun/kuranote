"use client";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useRef, useState, type ChangeEvent } from "react";
import { flushSync } from "react-dom";

import { flowMessages as m } from "config/transactionStepFlowMessages";
import { TransactionBottomEditorDrawer } from "molecules/transactions/TransactionBottomEditorDrawer/TransactionBottomEditorDrawer";
import { designTokens } from "theme/theme";

import {
  receiptPencilSx,
  receiptSectionSx,
  receiptSectionTitleSx,
} from "./receiptStyles";

/** 小票的备注区：点一下从底部抽屉编辑；只读时没有备注就不显示。 */
export function ReceiptNoteSection({
  note,
  onChange,
  readOnly = false,
}: {
  note: string;
  onChange: (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
  readOnly?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  if (readOnly) {
    return note ? (
      <Box sx={receiptSectionSx}>
        <Typography variant="caption" sx={receiptSectionTitleSx}>
          {m.note}
        </Typography>
        <Typography variant="body2" sx={readOnlyNoteSx}>
          {note}
        </Typography>
      </Box>
    ) : null;
  }
  return (
    <Box sx={receiptSectionSx}>
      <Typography variant="caption" sx={receiptSectionTitleSx}>
        {m.note}
      </Typography>
      <ButtonBase
        aria-label={m.editReceiptRow(m.note, note || m.addNote)}
        onClick={() => {
          // 在点击事件内挂载并聚焦，让 iOS 可以打开软键盘。
          flushSync(() => setOpen(true));
          inputRef.current?.focus({ preventScroll: true });
        }}
        sx={noteRowSx}
      >
        <Typography
          variant="body2"
          sx={[
            { flex: 1, overflowWrap: "anywhere", whiteSpace: "pre-wrap" },
            !note && { color: "text.disabled" },
          ]}
        >
          {note || m.addNote}
        </Typography>
        <EditOutlinedIcon aria-hidden sx={receiptPencilSx} />
      </ButtonBase>
      <TransactionBottomEditorDrawer
        open={open}
        title={m.note}
        onClose={() => setOpen(false)}
      >
        <TextField
          inputRef={inputRef}
          multiline
          minRows={4}
          fullWidth
          value={note}
          onChange={onChange}
          helperText={m.noteCount(note.length)}
          slotProps={{
            htmlInput: { "aria-label": m.note, maxLength: m.noteLimit },
          }}
        />
      </TransactionBottomEditorDrawer>
    </Box>
  );
}

const noteRowSx = {
  display: "flex",
  alignItems: "center",
  gap: 1,
  width: "100%",
  minHeight: 40,
  borderRadius: `${designTokens.radius.sm}px`,
  color: "text.primary",
  textAlign: "left",
};
const readOnlyNoteSx = {
  minHeight: 40,
  py: 1,
  overflowWrap: "anywhere",
  whiteSpace: "pre-wrap",
};
