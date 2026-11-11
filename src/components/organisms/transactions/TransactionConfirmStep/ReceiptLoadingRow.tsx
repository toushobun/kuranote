import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import { designTokens } from "theme/theme";

/** 小票建议读取中占位，与添加按钮等高，结束后可原地切换。 */
export function ReceiptLoadingRow({ label }: { label: string }) {
  return (
    <Box
      role="status"
      sx={{
        minHeight: designTokens.size.buttonMinHeight,
        px: 1,
        py: 0.75,
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
