import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

type TransactionPendingReimbursementCheckboxProps = {
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
};

export function TransactionPendingReimbursementCheckbox({
  checked,
  disabled = false,
  onChange,
}: TransactionPendingReimbursementCheckboxProps) {
  return (
    <Stack component="section" spacing={0.25} sx={containerSx}>
      <FormControlLabel
        control={
          <Checkbox
            checked={checked}
            disabled={disabled}
            onChange={(event) => onChange(event.target.checked)}
          />
        }
        label="待报销"
        sx={labelSx}
      />
      <Typography color="text.secondary" variant="caption">
        退款或报销核销完成后，将自动更新结算状态。
      </Typography>
    </Stack>
  );
}

const containerSx = {
  borderTop: 1,
  borderColor: "divider",
  mt: 1.5,
  pt: 1.25,
};

const labelSx = {
  m: 0,
  "& .MuiFormControlLabel-label": { fontWeight: 800 },
};
