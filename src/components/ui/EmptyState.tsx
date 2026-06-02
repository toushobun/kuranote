import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";

type EmptyStateProps = {
  title: string;
  description: string;
};

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <Paper
      elevation={0}
      sx={{ mt: 4, p: 3, border: "1px dashed", borderColor: "divider" }}
    >
      <Typography variant="h6" sx={{ fontWeight: 700 }}>
        {title}
      </Typography>
      <Typography color="text.secondary" sx={{ mt: 1 }}>
        {description}
      </Typography>
    </Paper>
  );
}
