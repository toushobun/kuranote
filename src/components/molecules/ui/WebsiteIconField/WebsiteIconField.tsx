import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";

export function WebsiteIconField({
  label,
  placeholder,
  buttonLabel,
  websiteUrl,
  loading,
  onClick,
  onWebsiteUrlChange,
}: {
  label: string;
  placeholder?: string;
  buttonLabel: string;
  websiteUrl: string;
  loading: boolean;
  onClick?: () => void;
  onWebsiteUrlChange: (value: string) => void;
}) {
  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
      <TextField
        autoComplete="url"
        fullWidth
        label={label}
        name="websiteUrl"
        onChange={(event) => onWebsiteUrlChange(event.target.value)}
        placeholder={placeholder}
        type="url"
        size="small"
        value={websiteUrl}
      />
      <Button
        disabled={!onClick || !websiteUrl.trim() || loading}
        onClick={onClick}
        size="small"
        startIcon={<DownloadRoundedIcon />}
        sx={{
          flexShrink: 0,
          minHeight: 40,
          whiteSpace: "nowrap",
        }}
        type="button"
        variant="outlined"
      >
        {buttonLabel}
      </Button>
    </Stack>
  );
}
