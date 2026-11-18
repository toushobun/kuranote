"use client";

import { useRef, useState } from "react";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Link from "next/link";

import { transactionAttachmentMessages as m } from "config/transactionAttachmentMessages";
import { loadReceiptPhotos } from "internal/transaction/adapter/next/attachmentActions";
import {
  BackLayerScope,
  transactionBackLayerLevels,
} from "molecules/ui/UnsavedChangesDialog/BackLayerScope";
import { TransactionRow } from "molecules/transactions/TransactionRow";
import { ReceiptPhotoViewer } from "organisms/transactions/ReceiptParts/ReceiptPhotoViewer";
import type { ReceiptPhotoPreview } from "organisms/transactions/ReceiptParts/ReceiptPhotoViewer";
import { userThemeCardBorder } from "theme/userThemeCardSx";
import type { TransactionRowItem } from "types/transactions";

type TransactionRowLinkProps = {
  href: string;
  item: TransactionRowItem;
  showDivider?: boolean;
};

/**
 * 有照片时使用独立的绝对定位链接和 IconButton 兄弟节点，
 * 不在 <a> 里面嵌套 <button>。44px 点击区域不增加列表行高。
 */
export function TransactionRowLink({
  href,
  item,
  showDivider = false,
}: TransactionRowLinkProps) {
  const [viewerOpen, setViewerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [photos, setPhotos] = useState<ReceiptPhotoPreview[]>([]);
  const photoRequest = useRef(0);
  const hasPhotos =
    item.type !== "transfer" &&
    item.type !== "balance_adjustment" &&
    (item.attachmentCount ?? 0) > 0;

  const rowSx = [
    transactionRowLinkSx,
    showDivider && { borderBottom: userThemeCardBorder },
  ];

  async function openPhotoViewer() {
    const request = ++photoRequest.current;
    setPhotos([]);
    setViewerOpen(true);
    setLoading(true);
    try {
      const urls = await loadReceiptPhotos(item.id);
      if (request !== photoRequest.current) return;
      setPhotos(
        urls.map((photo) => ({
          id: photo.id,
          fullUrl: photo.fullUrl,
          thumbnailUrl: photo.thumbnailUrl,
        })),
      );
    } catch {
      if (request === photoRequest.current) setPhotos([]);
    } finally {
      if (request === photoRequest.current) setLoading(false);
    }
  }

  function closePhotoViewer() {
    // 关闭后废弃正在进行的读取，避免过期结果污染下一次预览。
    photoRequest.current += 1;
    setViewerOpen(false);
    setLoading(false);
  }

  if (!hasPhotos) {
    return (
      <Box component={Link} href={href} sx={rowSx}>
        <TransactionRow item={item} showAccount showTime />
      </Box>
    );
  }

  return (
    <Box
      sx={[
        { position: "relative" },
        showDivider && { borderBottom: userThemeCardBorder },
      ]}
    >
      <Box
        component={Link}
        aria-label="进入记录"
        href={href}
        sx={{
          ...transactionRowLinkSx,
          position: "absolute",
          inset: 0,
          zIndex: 1,
        }}
      />
      <TransactionRow
        item={item}
        showAccount
        showTime
        photoAction={
          <IconButton
            aria-label={m.photoPreview}
            onClick={() => void openPhotoViewer()}
            sx={{
              position: "relative",
              zIndex: 2,
              flexShrink: 0,
              height: 44,
              width: 44,
              my: "-14px",
              color: "text.secondary",
              p: 0,
            }}
          >
            <ImageOutlinedIcon sx={{ fontSize: 14 }} />
          </IconButton>
        }
      />
      <BackLayerScope level={transactionBackLayerLevels.pageOverlay}>
        <ReceiptPhotoViewer
          photos={photos}
          loading={loading}
          open={viewerOpen}
          onClose={closePhotoViewer}
        />
      </BackLayerScope>
    </Box>
  );
}

const transactionRowLinkSx = {
  color: "inherit",
  display: "block",
  outline: "none",
  textDecoration: "none",
  WebkitTapHighlightColor: "transparent",
  "&:focus-visible": {
    outline: "2px solid var(--user-theme-action-text)",
    outlineOffset: "-2px",
  },
};
