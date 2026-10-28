"use client";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { designTokens } from "theme/theme";
import { entrySelectionRowSx as rowSx } from "organisms/transactions/transactionStepFlowStyles";
import { flowMessages as m } from "config/transactionStepFlowMessages";

export type EntryMethod = "merchant" | "transfer" | "standard";
type EntryMethodDrawerProps = {
  open: boolean;
  onClose: () => void;
  onMethodChange: (method: EntryMethod) => void;
};
export function EntryMethodDrawer({
  open,
  onClose,
  onMethodChange,
}: EntryMethodDrawerProps) {
  return (
    <Drawer
      sx={{ zIndex: (theme) => theme.zIndex.modal + 1 }}
      anchor="bottom"
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            borderRadius: `${designTokens.radius.lg}px ${designTokens.radius.lg}px 0 0`,
            maxWidth: 560,
            mx: "auto",
          },
        },
      }}
    >
      <Box sx={{ p: 2 }}>
        <Stack
          direction="row"
          sx={{ alignItems: "center", justifyContent: "space-between" }}
        >
          <Typography variant="h6">{m.methodTitle}</Typography>
          <IconButton aria-label={m.closeDrawer} onClick={onClose}>
            <CloseRoundedIcon />
          </IconButton>
        </Stack>
        <List>
          {m.methods.map((method) => (
            <ListItemButton
              key={method.id}
              disabled={"disabled" in method && method.disabled}
              onClick={() => {
                onClose();
                if (
                  method.id === "merchant" ||
                  method.id === "transfer" ||
                  method.id === "standard"
                )
                  onMethodChange(method.id);
              }}
              sx={rowSx}
            >
              <ListItemText primary={method.label} />
              {"badge" in method && <Chip size="small" label={method.badge} />}
              {"disabled" in method && <Chip size="small" label={m.soon} />}
              {method.id === "merchant" && <CheckRoundedIcon color="primary" />}
            </ListItemButton>
          ))}
        </List>
      </Box>
    </Drawer>
  );
}
