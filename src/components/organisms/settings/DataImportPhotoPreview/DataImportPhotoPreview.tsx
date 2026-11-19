"use client";

import { useEffect, useRef, useState } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import type { EmbeddedWorksheetPhoto } from "internal/dataImport/entity/parsedTable";
import { SectionCard } from "molecules/ui/SectionCard";
import { dataImportResultMessages } from "config/dataImportExportMessages";

export type DataImportPhotoPreviewRow = {
  amount: number;
  merchantName: string;
  photos: EmbeddedWorksheetPhoto[];
  rowNumber: number;
  transactionAt: string;
};

function PhotoThumbnail({ photo }: { photo: EmbeddedWorksheetPhoto }) {
  const wrapper = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    if (!wrapper.current) return;
    if (typeof IntersectionObserver === "undefined") {
      let active = true;
      queueMicrotask(() => {
        if (active) setVisible(true);
      });
      return () => {
        active = false;
      };
    }
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) setVisible(true);
    });
    observer.observe(wrapper.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;
    const url = URL.createObjectURL(
      new Blob([new Uint8Array(photo.bytes)], { type: photo.mimeType }),
    );
    let active = true;
    queueMicrotask(() => {
      if (active) setSrc(url);
    });
    return () => {
      active = false;
      URL.revokeObjectURL(url);
    };
  }, [photo, visible]);

  return (
    <Box ref={wrapper} sx={{ width: 72, height: 72 }}>
      {src ? (
        <Box
          component="img"
          alt={photo.columnName}
          loading="lazy"
          src={src}
          sx={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            borderRadius: 1,
          }}
        />
      ) : null}
    </Box>
  );
}

export function DataImportPhotoPreview({
  rows,
}: {
  rows: DataImportPhotoPreviewRow[];
}) {
  return (
    <SectionCard>
      <Stack spacing={1.5}>
        <Typography sx={{ fontWeight: 700 }}>
          {dataImportResultMessages.photoPreviewTitle}
        </Typography>
        {rows.map(({ rowNumber, photos, transactionAt, merchantName, amount }) => (
          <Stack key={rowNumber} spacing={1}>
            <Typography variant="body2">
              {dataImportResultMessages.issueRowLabel(rowNumber)} ·{" "}
              {dataImportResultMessages.photoPreviewDetail(
                transactionAt,
                merchantName,
                amount,
              )}
            </Typography>
            <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
              {photos.map((photo) => (
                <PhotoThumbnail key={photo.columnName} photo={photo} />
              ))}
            </Stack>
          </Stack>
        ))}
      </Stack>
    </SectionCard>
  );
}
