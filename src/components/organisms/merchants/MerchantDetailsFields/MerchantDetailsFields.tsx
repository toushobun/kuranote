"use client";

import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import Avatar from "@mui/material/Avatar";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useEffect, useState } from "react";

import { merchantText } from "config/merchantText";
import { getMerchantInitial, merchantIconSrc } from "utils/merchants";

type MerchantDetailsFieldsProps = {
  ledgerId: string;
  name: string;
  note: string;
  onNameChange: (value: string) => void;
  onNoteChange: (value: string) => void;
  onWebsiteUrlChange: (value: string) => void;
  websiteUrl: string;
};

const iconPreviewDebounceMs = 400;

export function MerchantDetailsFields({
  ledgerId,
  name,
  note,
  onNameChange,
  onNoteChange,
  onWebsiteUrlChange,
  websiteUrl,
}: MerchantDetailsFieldsProps) {
  const [previewWebsiteUrl, setPreviewWebsiteUrl] = useState(websiteUrl);

  useEffect(() => {
    const timeout = window.setTimeout(
      () => setPreviewWebsiteUrl(websiteUrl),
      iconPreviewDebounceMs,
    );

    return () => window.clearTimeout(timeout);
  }, [websiteUrl]);

  return (
    <Stack spacing={2.5}>
      <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
        <Avatar
          src={merchantIconSrc(ledgerId, previewWebsiteUrl || null)}
          sx={{
            bgcolor: "var(--user-theme-icon-badge-bg)",
            color: "var(--user-theme-icon-badge-color)",
            height: 64,
            width: 64,
          }}
        >
          {getMerchantInitial(name)}
        </Avatar>
        <Stack
          direction="row"
          spacing={1}
          sx={{ alignItems: "flex-start", flex: 1 }}
        >
          <CheckCircleRoundedIcon color="success" />
          <Typography color="text.secondary" variant="body2">
            {merchantText.websiteHelper}
          </Typography>
        </Stack>
      </Stack>

      <TextField
        autoComplete="organization"
        fullWidth
        label={merchantText.nameLabel}
        name="name"
        onChange={(event) => onNameChange(event.target.value)}
        placeholder="例如：Amazon"
        required
        slotProps={{ htmlInput: { maxLength: 100 } }}
        value={name}
      />

      <TextField
        autoComplete="url"
        fullWidth
        label={merchantText.websiteLabel}
        name="websiteUrl"
        onChange={(event) => onWebsiteUrlChange(event.target.value)}
        placeholder="https://www.example.com"
        type="url"
        value={websiteUrl}
      />

      <TextField
        fullWidth
        label={merchantText.noteLabel}
        minRows={3}
        multiline
        name="note"
        onChange={(event) => onNoteChange(event.target.value)}
        placeholder="例如：常去的超市、药妆店、网购平台等"
        slotProps={{ htmlInput: { maxLength: 1000 } }}
        value={note}
      />
    </Stack>
  );
}
