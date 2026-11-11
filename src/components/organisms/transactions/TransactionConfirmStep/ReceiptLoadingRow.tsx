import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import { receiptActionRowSx } from "./ReceiptAddButton";

/** 小票建议读取中占位，与添加按钮等高，结束后可原地切换。 */
export function ReceiptLoadingRow({ label }: { label: string }) {
  return (
    <Box
      role="status"
      sx={{
        ...receiptActionRowSx,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 1,
      }}
    >
      <CircularProgress size={16} aria-hidden="true" />
      <Typography variant="body2" sx={{ color: "text.secondary" }}>
        {label}
      </Typography>
    </Box>
  );
}
