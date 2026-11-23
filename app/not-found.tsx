import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { routePaths } from "config/paths";

import { notFoundMessages } from "./notFoundMessages";

export default function NotFound() {
  return (
    <Box
      sx={{
        alignItems: "center",
        bgcolor: "var(--user-theme-page-bg)",
        display: "flex",
        justifyContent: "center",
        minHeight: "100dvh",
        p: 3,
      }}
    >
      <Stack spacing={2} sx={{ alignItems: "center", textAlign: "center" }}>
        <Typography
          variant="h5"
          sx={{ color: "var(--user-theme-tx-name)", fontWeight: 800 }}
        >
          {notFoundMessages.title}
        </Typography>
        <Button href={routePaths.transactions} variant="contained">
          {notFoundMessages.backToTransactions}
        </Button>
      </Stack>
    </Box>
  );
}
