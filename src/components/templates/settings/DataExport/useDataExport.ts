"use client";

import { useRef, useState } from "react";
import { dataExportPageMessages } from "config/dataImportExportMessages";
import {
  dataExportErrorMessages,
  IncompleteDataExportError,
} from "internal/dataExport";
import type { DataExportAction } from "types/dataExport";

export function useDataExport(exportAction: DataExportAction) {
  const busy = useRef(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasDownloaded, setHasDownloaded] = useState(false);

  async function handleExport() {
    if (busy.current) return;
    busy.current = true;
    setIsExporting(true);
    setError(null);
    setHasDownloaded(false);
    try {
      const state = await exportAction();
      if (!state.data) {
        setError(state.error ?? dataExportErrorMessages.exportFailed);
        return;
      }
      const { buildDataExportWorkbook } =
        await import("utils/dataExportWorkbook");
      const buffer = await buildDataExportWorkbook(state.data);
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      try {
        anchor.href = url;
        anchor.download = dataExportPageMessages.fileName;
        document.body.appendChild(anchor);
        anchor.click();
        setHasDownloaded(true);
      } finally {
        anchor.remove();
        // 延后释放，给浏览器接管下载留出时间。
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
    } catch (error) {
      setError(
        error instanceof IncompleteDataExportError
          ? error.message
          : dataExportErrorMessages.downloadFailed,
      );
    } finally {
      busy.current = false;
      setIsExporting(false);
    }
  }
  return {
    isExporting,
    error,
    hasDownloaded,
    handleExport,
    closeError: () => setError(null),
  };
}
