import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

type MerchantAliasListProps = {
  aliases: string[];
};

export function MerchantAliasList({ aliases }: MerchantAliasListProps) {
  if (aliases.length === 0) {
    return (
      <Typography color="text.secondary" sx={{ mt: 1 }} variant="body2">
        还没有别名。
      </Typography>
    );
  }

  return (
    <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: "wrap" }}>
      {aliases.map((alias) => (
        <Chip key={alias} label={alias} size="small" />
      ))}
    </Stack>
  );
}
