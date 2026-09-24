"use client";

import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";

/** 邀请链接只读输入框，「邀请成员」弹框与邀请详情共用。 */
export function LedgerInviteLinkField({
  link,
  onCopy,
}: {
  link: string;
  onCopy: (link: string) => void;
}) {
  return (
    <TextField
      fullWidth
      label="邀请链接"
      slotProps={{
        htmlInput: { readOnly: true },
        input: {
          endAdornment: link ? (
            <InputAdornment position="end">
              <IconButton
                aria-label="复制"
                edge="end"
                onClick={() => onCopy(link)}
                size="small"
                type="button"
              >
                <ContentCopyRoundedIcon fontSize="small" />
              </IconButton>
            </InputAdornment>
          ) : null,
        },
      }}
      value={link || "生成后将在这里显示邀请链接"}
    />
  );
}
