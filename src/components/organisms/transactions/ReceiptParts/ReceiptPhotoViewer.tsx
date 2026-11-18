"use client";

import { useEffect, useRef, useState } from "react";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import ArrowBackIosNewRoundedIcon from "@mui/icons-material/ArrowBackIosNewRounded";
import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import { transactionAttachmentMessages as m } from "config/transactionAttachmentMessages";
import { useBackLayer } from "molecules/ui/UnsavedChangesDialog/BackLayerScope";

export type ReceiptPhotoPreview = {
  id: string;
  fullUrl: string;
  thumbnailUrl?: string;
};

export type ReceiptPhotoViewerProps = {
  photos: readonly ReceiptPhotoPreview[];
  open: boolean;
  loading?: boolean;
  initialIndex?: number;
  onClose: () => void;
};

function distance(touches: React.TouchList) {
  const first = touches.item(0);
  const second = touches.item(1);
  if (!first || !second) return 0;
  return Math.hypot(
    first.clientX - second.clientX,
    first.clientY - second.clientY,
  );
}

/** MUI Dialog 默认 Portal 至 body，绕开 AppShell 的 main 层叠上下文。 */
export function ReceiptPhotoViewer({
  photos,
  open,
  loading = false,
  initialIndex = 0,
  onClose,
}: ReceiptPhotoViewerProps) {
  const [index, setIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [error, setError] = useState("");
  const startPoint = useRef<{ x: number; y: number } | null>(null);
  const pinchStart = useRef<{ distance: number; scale: number } | null>(null);
  useBackLayer(open, onClose, 3);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 每次打开使用当前点击的缩略图编号。
    if (open) setIndex(Math.min(initialIndex, Math.max(0, photos.length - 1)));
  }, [initialIndex, open, photos.length]);

  const photo = photos[index];
  const move = (offset: number) => {
    setIndex((current) =>
      Math.min(Math.max(0, current + offset), photos.length - 1),
    );
    setScale(1);
    setError("");
  };
  const handleTouchStart = (event: React.TouchEvent) => {
    if (event.touches.length === 2) {
      pinchStart.current = {
        distance: distance(event.touches),
        scale,
      };
      startPoint.current = null;
      return;
    }
    const touch = event.touches.item(0);
    if (touch) startPoint.current = { x: touch.clientX, y: touch.clientY };
    pinchStart.current = null;
  };
  const handleTouchMove = (event: React.TouchEvent) => {
    if (event.touches.length === 2 && pinchStart.current) {
      const ratio =
        distance(event.touches) / Math.max(1, pinchStart.current.distance);
      setScale(Math.max(1, Math.min(5, pinchStart.current.scale * ratio)));
    }
  };
  const handleTouchEnd = (event: React.TouchEvent) => {
    if (pinchStart.current) {
      if (event.touches.length === 0) pinchStart.current = null;
      return;
    }
    const start = startPoint.current;
    const touch = event.changedTouches.item(0);
    if (!start || !touch || scale > 1) return;
    startPoint.current = null;
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    if (Math.abs(dy) > 95 && dy > 0 && Math.abs(dy) > Math.abs(dx)) {
      onClose();
    } else if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) {
      move(dx < 0 ? 1 : -1);
    }
  };

  const saveToAlbum = async () => {
    if (!photo) return;
    try {
      const response = await fetch(photo.fullUrl);
      if (!response.ok) throw new Error(m.loadFailed);
      const blob = await response.blob();
      const file = new File([blob], `receipt-${index + 1}.jpg`, {
        type: "image/jpeg",
      });
      if (
        navigator.share &&
        (!navigator.canShare || navigator.canShare({ files: [file] }))
      ) {
        await navigator.share({ files: [file], title: m.photoShareTitle });
        return;
      }
      const downloadUrl = URL.createObjectURL(file);
      const anchor = document.createElement("a");
      anchor.href = downloadUrl;
      anchor.download = file.name;
      anchor.click();
      setTimeout(() => URL.revokeObjectURL(downloadUrl), 0);
    } catch (caught: unknown) {
      // 用户取消系统分享不视为文件损坏。
      if (caught instanceof DOMException && caught.name === "AbortError")
        return;
      setError(m.loadFailed);
    }
  };

  return (
    <Dialog
      fullScreen
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: { bgcolor: "#101010", color: "#fff", m: 0 },
        },
      }}
    >
      <Stack sx={{ bgcolor: "#101010", height: "100dvh", minHeight: 0 }}>
        <Stack
          direction="row"
          sx={{
            alignItems: "center",
            justifyContent: "space-between",
            px: 1,
            pt: "env(safe-area-inset-top)",
            minHeight: 60,
          }}
        >
          <IconButton
            color="inherit"
            aria-label={m.photoClose}
            onClick={onClose}
          >
            <CloseRoundedIcon />
          </IconButton>
          <Typography sx={{ color: "#fff", fontSize: 14 }}>
            {photos.length ? `${index + 1} / ${photos.length}` : ""}
          </Typography>
          <Box sx={{ width: 48 }} />
        </Stack>
        <Box
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === "ArrowLeft") move(-1);
            if (event.key === "ArrowRight") move(1);
            if (event.key === "Escape") onClose();
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          sx={{
            alignItems: "center",
            display: "flex",
            flex: 1,
            justifyContent: "center",
            minHeight: 0,
            overflow: "hidden",
            position: "relative",
            touchAction: "pan-y",
          }}
        >
          {loading ? (
            <Stack spacing={1} sx={{ alignItems: "center" }}>
              <CircularProgress color="inherit" size={26} />
              <Typography variant="caption" sx={{ color: "#fff" }}>
                {m.photoLoading}
              </Typography>
            </Stack>
          ) : photo ? (
            <>
              <Box
                component="img"
                alt={m.photoPreview}
                src={photo.fullUrl}
                onDoubleClick={() => setScale((value) => (value === 1 ? 2 : 1))}
                sx={{
                  maxWidth: "100%",
                  maxHeight: "100%",
                  objectFit: "contain",
                  userSelect: "none",
                  transform: `scale(${scale})`,
                  transition: "transform 120ms ease",
                }}
              />
              {photos.length > 1 && scale === 1 ? (
                <>
                  <IconButton
                    aria-label="上一张"
                    disabled={index === 0}
                    onClick={() => move(-1)}
                    sx={{ position: "absolute", left: 4, color: "#fff" }}
                  >
                    <ArrowBackIosNewRoundedIcon />
                  </IconButton>
                  <IconButton
                    aria-label="下一张"
                    disabled={index === photos.length - 1}
                    onClick={() => move(1)}
                    sx={{ position: "absolute", right: 4, color: "#fff" }}
                  >
                    <ArrowForwardIosRoundedIcon />
                  </IconButton>
                </>
              ) : null}
            </>
          ) : (
            <Typography sx={{ color: "#fff" }}>
              {error || m.loadFailed}
            </Typography>
          )}
        </Box>
        <Stack
          sx={{
            alignItems: "center",
            pb: "max(20px, env(safe-area-inset-bottom))",
            pt: 1,
          }}
        >
          <Button
            color="inherit"
            disabled={!photo || loading}
            onClick={() => void saveToAlbum()}
            startIcon={<DownloadRoundedIcon />}
            sx={{ color: "#fff", textTransform: "none" }}
          >
            {m.photoSaveAlbum}
          </Button>
          {error && (
            <Typography variant="caption" sx={{ color: "#ffc6bd" }}>
              {error}
            </Typography>
          )}
        </Stack>
      </Stack>
    </Dialog>
  );
}
