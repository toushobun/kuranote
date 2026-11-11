import AddRoundedIcon from "@mui/icons-material/AddRounded";
import Button from "@mui/material/Button";

// 与 MUI 默认文字按钮相同的行高和内边距，读取提示替换按钮时保持布局稳定。
export const receiptActionRowSx = { minHeight: 36.5, px: 1, py: 0.75 };

export function ReceiptAddButton({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <Button
      fullWidth
      sx={receiptActionRowSx}
      startIcon={<AddRoundedIcon />}
      onClick={onClick}
      disabled={disabled}
    >
      {label}
    </Button>
  );
}
