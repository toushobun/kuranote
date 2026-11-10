"use client";

import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useState } from "react";

import { WebsiteIconField } from "molecules/ui/WebsiteIconField/WebsiteIconField";
import { merchantText } from "config/merchantText";
import type { MerchantIconStateAction } from "types/merchants";

import { MerchantAvatar } from "../MerchantAvatar/MerchantAvatar";

type MerchantDetailsFieldsProps = {
  fetchIconAction: MerchantIconStateAction;
  previewIconUrl: string;
  ledgerId: string;
  merchantId?: string;
  name: string;
  note: string;
  onPreviewIconChange: (url: string) => void;
  onNameChange: (value: string) => void;
  onNoteChange: (value: string) => void;
  onWebsiteUrlChange: (value: string) => void;
  websiteUrl: string;
};

type IconPreviewStatus = "error" | "idle" | "loading" | "success";

export function MerchantDetailsFields({
  fetchIconAction,
  previewIconUrl,
  ledgerId,
  merchantId,
  name,
  note,
  onPreviewIconChange,
  onNameChange,
  onNoteChange,
  onWebsiteUrlChange,
  websiteUrl,
}: MerchantDetailsFieldsProps) {
  const [previewStatus, setPreviewStatus] = useState<IconPreviewStatus>(
    previewIconUrl ? "success" : "idle",
  );
  const [feedbackText, setFeedbackText] = useState<string | null>(null);
  const statusContent = {
    error: {
      color: "warning.main",
      icon: <ErrorOutlineRoundedIcon fontSize="small" />,
      text: feedbackText ?? merchantText.iconError,
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
      text: feedbackText ?? merchantText.iconSuccess,
    },
  }[previewStatus];

  return (
    <Stack spacing={2}>
      <input name="previewIconUrl" type="hidden" value={previewIconUrl} />
      <Stack direction="row" spacing={2} sx={{ alignItems: "center", px: 0.5 }}>
        <MerchantAvatar
          loading={previewStatus === "loading"}
          onError={() => {
            setFeedbackText(merchantText.iconError);
            setPreviewStatus("error");
          }}
          padding={1}
          size={{ xs: 84, sm: 96 }}
          src={previewIconUrl || undefined}
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
          <Typography color="textSecondary" variant="body2">
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

      <WebsiteIconField
        label={merchantText.websiteLabel}
        placeholder={merchantText.websitePlaceholder}
        buttonLabel={merchantText.iconRefresh}
        websiteUrl={websiteUrl}
        loading={previewStatus === "loading"}
        onWebsiteUrlChange={(value) => {
          onWebsiteUrlChange(value);
          onPreviewIconChange("");
          setFeedbackText(null);
          setPreviewStatus("idle");
        }}
        onClick={async () => {
          setFeedbackText(null);
          setPreviewStatus("loading");
          const formData = new FormData();
          formData.set("websiteUrl", websiteUrl);

          try {
            const state = await fetchIconAction({}, formData);
            if (state.error || !state.iconUrl) {
              setFeedbackText(state.error ?? merchantText.iconError);
              setPreviewStatus("error");
              return;
            }
            onPreviewIconChange(state.iconUrl ?? "");
            setFeedbackText(state.success ?? merchantText.iconSuccess);
            setPreviewStatus("success");
          } catch {
            setFeedbackText(merchantText.iconError);
            setPreviewStatus("error");
          }
        }}
      />

      <TextField
        fullWidth
        label={merchantText.noteLabel}
        minRows={2}
        multiline
        name="note"
        onChange={(event) => onNoteChange(event.target.value)}
        placeholder={merchantText.notePlaceholder}
        size="small"
        slotProps={{ htmlInput: { maxLength: 200000 } }}
        value={note}
      />
    </Stack>
  );
}
