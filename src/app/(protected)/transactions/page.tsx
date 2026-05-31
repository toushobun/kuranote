import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";

export default function TransactionsPage() {
  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 4, sm: 5 },
        border: "1px solid",
        borderColor: "divider",
      }}
    >
      <Typography component="h1" variant="h4" sx={{ fontWeight: 700 }}>
        记账
      </Typography>
      <Typography color="text.secondary" sx={{ mt: 2 }}>
        记账列表和新增入口将在后续 Issue 中实现。
      </Typography>
    </Paper>
  );
}
