"use client";

import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useEffect, useState } from "react";

import { merchantText } from "config/merchantText";
import { merchantIconSrc } from "utils/merchants";

import { MerchantAvatar } from "../MerchantAvatar/MerchantAvatar";

type MerchantDetailsFieldsProps = {
  ledgerId: string;
  merchantId?: string;
  name: string;
  note: string;
  onNameChange: (value: string) => void;
  onNoteChange: (value: string) => void;
  onWebsiteUrlChange: (value: string) => void;
  websiteUrl: string;
};

const iconPreviewDebounceMs = 400;
type IconPreviewStatus = "error" | "idle" | "loading" | "success";

export function MerchantDetailsFields({
  ledgerId,
  merchantId,
  name,
  note,
  onNameChange,
  onNoteChange,
  onWebsiteUrlChange,
  websiteUrl,
}: MerchantDetailsFieldsProps) {
  const [previewWebsiteUrl, setPreviewWebsiteUrl] = useState(websiteUrl);
  const [refreshKey, setRefreshKey] = useState(0);
  const [previewStatus, setPreviewStatus] = useState<IconPreviewStatus>(() =>
    merchantIconSrc(ledgerId, websiteUrl || null) ? "loading" : "idle",
  );

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setPreviewWebsiteUrl(websiteUrl);
      setPreviewStatus(
        merchantIconSrc(ledgerId, websiteUrl || null) ? "loading" : "idle",
      );
    }, iconPreviewDebounceMs);

    return () => window.clearTimeout(timeout);
  }, [ledgerId, websiteUrl]);

  const baseIconSrc = merchantIconSrc(ledgerId, previewWebsiteUrl || null);
  const iconSrc = baseIconSrc
    ? `${baseIconSrc}&refresh=${refreshKey}`
    : undefined;
  const canRefresh = Boolean(merchantIconSrc(ledgerId, websiteUrl || null));
  const statusContent = {
    error: {
      color: "warning.main",
      icon: <ErrorOutlineRoundedIcon fontSize="small" />,
      text: merchantText.iconError,
    },
    idle: {
      color: "text.secondary",
      icon: null,
      text: merchantText.iconIdle,
    },
    loading: {
      color: "text.secondary",
      icon: <CircularProgress aria-hidden size={18} />,
      text: merchantText.iconLoading,
    },
    success: {
      color: "success.main",
      icon: <CheckCircleRoundedIcon fontSize="small" />,
      text: merchantText.iconSuccess,
    },
  }[previewStatus];

  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={2} sx={{ alignItems: "center", px: 0.5 }}>
        <MerchantAvatar
          loading={previewStatus === "loading"}
          onError={() => setPreviewStatus("error")}
          onLoad={() => setPreviewStatus("success")}
          padding={1}
          size={{ xs: 84, sm: 96 }}
          src={iconSrc}
          toneKey={merchantId ?? `new-merchant:${ledgerId}`}
        />
        <Stack spacing={0.5} sx={{ flex: 1 }}>
          <Stack
            direction="row"
            spacing={0.75}
            sx={{ alignItems: "center", color: statusContent.color }}
          >
            {statusContent.icon}
            <Typography
              color="inherit"
              sx={{ fontWeight: 800 }}
              variant="body2"
            >
              {statusContent.text}
            </Typography>
          </Stack>
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
        placeholder={merchantText.namePlaceholder}
        required
        size="small"
        slotProps={{ htmlInput: { maxLength: 100 } }}
        value={name}
      />

      <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
        <TextField
          autoComplete="url"
          fullWidth
          label={merchantText.websiteLabel}
          name="websiteUrl"
          onChange={(event) => onWebsiteUrlChange(event.target.value)}
          placeholder={merchantText.websitePlaceholder}
          type="url"
          size="small"
          value={websiteUrl}
        />
        <IconButton
          aria-label={merchantText.iconRefresh}
          disabled={!canRefresh || previewStatus === "loading"}
          onClick={() => {
            setPreviewWebsiteUrl(websiteUrl);
            setPreviewStatus("loading");
            setRefreshKey((currentKey) => currentKey + 1);
          }}
          sx={{
            border: "1px solid",
            borderColor: "divider",
            flexShrink: 0,
          }}
        >
          <RefreshRoundedIcon />
        </IconButton>
      </Stack>

      <TextField
        fullWidth
        label={merchantText.noteLabel}
        minRows={2}
        multiline
        name="note"
        onChange={(event) => onNoteChange(event.target.value)}
        placeholder={merchantText.notePlaceholder}
        size="small"
        slotProps={{ htmlInput: { maxLength: 1000 } }}
        value={note}
      />
    </Stack>
  );
}
