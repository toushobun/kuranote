import TextField, { type TextFieldProps } from "@mui/material/TextField";

import { placeholderMemberText } from "config/placeholderMemberText";
import { ledgerPlaceholderMemberNameMaxLength } from "internal/ledger";

/**
 * 待邀请成员名字输入框：邀请成员与改名共用，统一字段名、必填和 100 字上限。
 * 前后空白由服务端去除，这里只做浏览器侧长度限制。
 */
export function LedgerPlaceholderNameField({
  label = placeholderMemberText.nameLabel,
  ...props
}: Pick<
  TextFieldProps,
  "autoFocus" | "defaultValue" | "label" | "onChange" | "value"
>) {
  return (
    <TextField
      autoComplete="off"
      fullWidth
      label={label}
      name="displayName"
      placeholder={placeholderMemberText.namePlaceholder}
      required
      slotProps={{
        htmlInput: { maxLength: ledgerPlaceholderMemberNameMaxLength },
      }}
      {...props}
    />
  );
}
