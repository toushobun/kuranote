import type { ReactNode } from "react";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

export function SelectionSectionHeader({
  title,
  hint,
  addLabel,
  onAdd,
}: {
  title: string;
  hint?: ReactNode;
  addLabel: string;
  onAdd?: () => void;
}) {
  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
      <Stack
        direction="row"
        spacing={1}
        sx={{ flex: 1, minWidth: 0, alignItems: "baseline", flexWrap: "wrap" }}
      >
        <Typography sx={{ fontWeight: "bold" }}>{title}</Typography>
        {hint && (
          <Typography variant="caption" color="textSecondary">
            {hint}
          </Typography>
        )}
      </Stack>
      {onAdd && (
        <Button
          size="small"
          startIcon={<AddRoundedIcon />}
          onClick={onAdd}
          sx={{ flexShrink: 0 }}
        >
          {addLabel}
        </Button>
      )}
    </Stack>
  );
}
