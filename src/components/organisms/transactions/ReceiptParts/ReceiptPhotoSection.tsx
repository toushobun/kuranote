"use client";

import { useRef, useState, type ChangeEvent } from "react";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import CameraAltOutlinedIcon from "@mui/icons-material/CameraAltOutlined";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { transactionAttachmentMessages as m } from "config/transactionAttachmentMessages";
import { receiptSectionSx, receiptSectionTitleSx } from "./receiptStyles";
import { ReceiptPhotoViewer } from "./ReceiptPhotoViewer";
import type { ReceiptPhotoController } from "./useReceiptPhotos";

export function ReceiptPhotoSection({
  controller,
  readOnly = false,
  disabled = false,
}: {
  controller: ReceiptPhotoController;
  readOnly?: boolean;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const { photos } = controller;
  const count = photos.length;

  if (readOnly && count === 0 && !controller.loading) return null;

  function selectFiles(event: ChangeEvent<HTMLInputElement>) {
    if (event.target.files) controller.addFiles(event.target.files);
    // iOS 同一张图片重新选取时需要触发 change。
    event.currentTarget.value = "";
  }

  const viewerPhotos = photos.map((photo) => ({
    id: photo.attachmentId ?? photo.key,
    fullUrl: photo.fullUrl,
    thumbnailUrl: photo.previewUrl,
  }));

  return (
    <Box sx={receiptSectionSx}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography variant="caption" sx={receiptSectionTitleSx}>
          {m.photoSection}
        </Typography>
        {!readOnly && count > 0 && (
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            {count} / 5
          </Typography>
        )}
      </Stack>
      {controller.loading && (
        <Stack direction="row" alignItems="center" spacing={1} sx={{ py: 1 }}>
          <CircularProgress size={18} />
          <Typography variant="caption">{m.photoLoading}</Typography>
        </Stack>
      )}
      <Stack
        direction="row"
        spacing={0.8}
        sx={{ alignItems: "center", overflowX: "auto", py: 0.4, minHeight: count ? 70 : 0 }}
      >
        {photos.map((photo, index) => (
          <Box
            key={photo.key}
            sx={{
              width: 62, height: 62, borderRadius: 1.4,
              bgcolor: "action.hover", flexShrink: 0,
              overflow: "hidden", position: "relative",
            }}
          >
            <ButtonBase
              aria-label={`${m.photoPreview} ${index + 1}`}
              disabled={photo.status === "uploading"}
              onClick={() => setViewerIndex(index)}
              sx={{ width: "100%", height: "100%" }}
            >
              <Box
                component="img"
                src={photo.previewUrl}
                alt=""
                sx={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </ButtonBase>
            {!readOnly && (
              <IconButton
                aria-label={`${m.photoRemove} ${index + 1}`}
                disabled={disabled}
                onClick={() => controller.remove(photo.key)}
                size="small"
                sx={{
                  position: "absolute", right: 1, top: 1, p: 0.25,
                  bgcolor: "rgba(0,0,0,.65)", color: "#fff",
                  "&:hover": { bgcolor: "rgba(0,0,0,.8)" },
                }}
              >
                <CloseRoundedIcon sx={{ fontSize: 16 }} />
              </IconButton>
            )}
            {photo.status === "uploading" && (
              <Stack
                alignItems="center"
                justifyContent="center"
                sx={{
                  position: "absolute", inset: 0,
                  bgcolor: "rgba(0,0,0,.34)", pointerEvents: "none",
                }}
              >
                <CircularProgress size={21} sx={{ color: "#fff" }} />
              </Stack>
            )}
            {photo.status === "failed" && (
              <ButtonBase
                aria-label={`${m.photoRetry} ${index + 1}`}
                onClick={() => controller.retry(photo.key)}
                disabled={disabled}
                sx={{
                  position: "absolute", inset: 0, width: "100%", height: "100%",
                  bgcolor: "rgba(147,28,28,.78)", color: "#fff",
                  fontSize: 12, fontWeight: 600,
                }}
              >
                {m.photoRetry}
              </ButtonBase>
            )}
          </Box>
        ))}
        {!readOnly && count < 5 && (
          <ButtonBase
            aria-label={count ? m.photoAddShort : m.photoAdd}
            disabled={disabled}
            onClick={() => inputRef.current?.click()}
            sx={{
              border: "1px dashed",
              borderColor: "warning.main",
              borderRadius: 1.5,
              color: "warning.dark",
              flex: count ? "0 0 62px" : "1 1 auto",
              height: count ? 62 : 40,
              width: count ? 62 : "100%",
              display: "flex", alignItems: "center",
              justifyContent: "center", gap: 0.6,
              flexDirection: count ? "column" : "row",
              fontSize: count ? 11 : 13,
            }}
          >
            {count ? <AddRoundedIcon fontSize="small" /> : <CameraAltOutlinedIcon fontSize="small" />}
            <Box component="span">{count ? m.photoAddShort : m.photoAdd}</Box>
          </ButtonBase>
        )}
      </Stack>
      {!readOnly && (
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={selectFiles}
          disabled={disabled || count >= 5}
          style={{ display: "none" }}
          aria-label={m.photoAdd}
        />
      )}
      {!readOnly && count === 0 && (
        <Typography variant="caption" sx={{ color: "text.disabled", fontSize: 11 }}>
          {m.photoEmptyHint}
        </Typography>
      )}
      {controller.error && (
        <Typography role="alert" variant="caption" sx={{ color: "error.main", display: "block", mt: 0.6 }}>
          {controller.error}
        </Typography>
      )}
      <ReceiptPhotoViewer
        photos={viewerPhotos}
        initialIndex={viewerIndex ?? 0}
        open={viewerIndex !== null}
        onClose={() => setViewerIndex(null)}
      />
    </Box>
  );
}
