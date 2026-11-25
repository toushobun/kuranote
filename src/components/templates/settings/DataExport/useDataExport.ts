"use client";

import { useRef, useState } from "react";
import { buildDataExportFileName } from "utils/dataExportFileName";
import type { DataExportOptions } from "internal/dataExport";
import {
  dataExportErrorMessages,
  IncompleteDataExportError,
  AccountSeparatorDataExportError,
} from "internal/dataExport";
import type { DataExportAction } from "types/dataExport";

export function useDataExport(exportAction: DataExportAction) {
  const busy = useRef(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadedFile, setDownloadedFile] = useState<string | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [recordTypes, setRecordTypes] = useState<
    DataExportOptions["recordTypes"]
  >(["normal", "transfer", "balance_adjustment"]);
  const invalidDateRange = Boolean(startDate && endDate && startDate > endDate);
  const canExport = recordTypes.length > 0 && !invalidDateRange;
  function toggleRecordType(type: DataExportOptions["recordTypes"][number]) {
    setRecordTypes((current) =>
      current.includes(type)
        ? current.filter((value) => value !== type)
        : [...current, type],
    );
  }
  const [includePhotos, setIncludePhotos] = useState(false);
  const [photoProgress, setPhotoProgress] = useState<{
    done: number;
    total: number;
  } | null>(null);

  async function handleExport() {
    if (busy.current || !canExport) return;
    busy.current = true;
    setIsExporting(true);
    setError(null);
    setDownloadedFile(null);
    setPhotoProgress(null);
    try {
      const start = startDate ? new Date(`${startDate}T00:00:00`) : null;
      const end = endDate ? new Date(`${endDate}T00:00:00`) : null;
      if (end) end.setDate(end.getDate() + 1);
      const state = await exportAction({
        includePhotos,
        recordTypes,
        ...(start ? { dateStart: start.toISOString() } : {}),
        ...(end ? { dateEnd: end.toISOString() } : {}),
      });
      if (!state.data) {
        setError(state.error ?? dataExportErrorMessages.exportFailed);
        return;
      }
      const { buildDataExportWorkbook } =
        await import("utils/dataExportWorkbook");
      const buffer = includePhotos
        ? await buildDataExportWorkbook(state.data, {
            onPhotoProgress: (done, total) => {
              if (total > 0) setPhotoProgress({ done, total });
            },
          })
        : await buildDataExportWorkbook(state.data);
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      try {
        anchor.href = url;
        const fileName = buildDataExportFileName(state.ledgerName);
        anchor.download = fileName;
        document.body.appendChild(anchor);
        anchor.click();
        setDownloadedFile(fileName);
      } finally {
        anchor.remove();
        // 延后释放，给浏览器接管下载留出时间。
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
    } catch (error) {
      setError(
        error instanceof IncompleteDataExportError ||
          error instanceof AccountSeparatorDataExportError
          ? error.message
          : dataExportErrorMessages.downloadFailed,
      );
    } finally {
      busy.current = false;
      setIsExporting(false);
      setPhotoProgress(null);
    }
  }
  return {
    includePhotos,
    setIncludePhotos,
    photoProgress,
    isExporting,
    error,
    downloadedFile,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    recordTypes,
    toggleRecordType,
    canExport,
    invalidDateRange,
    handleExport,
    closeError: () => setError(null),
  };
}
