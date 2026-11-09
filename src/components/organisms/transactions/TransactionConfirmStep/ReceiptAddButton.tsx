import AddRoundedIcon from "@mui/icons-material/AddRounded";
import Button from "@mui/material/Button";

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
      startIcon={<AddRoundedIcon />}
      onClick={onClick}
      disabled={disabled}
    >
      {label}
    </Button>
  );
}
