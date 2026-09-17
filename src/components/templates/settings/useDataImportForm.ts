"use client";

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from "react";

import { dataImportExecutionMessages } from "config/dataImportExportMessages";
import type { ImportExecutionResult } from "internal/dataImport";
import type {
  DataImportActionState,
  DataImportBatchStateAction,
  DataImportStateAction,
} from "types/dataImport";
import {
  buildDataImportResultFileName,
  buildDataImportResultWorkbook,
} from "utils/dataImportResultWorkbook";

const initialValidationState: DataImportActionState = {};

function createEmptyExecutionResult(totalCount: number): ImportExecutionResult {
  return {
    details: [],
    duplicateCount: 0,
    failureCount: 0,
    processedCount: 0,
    rowResults: [],
    successCount: 0,
    totalCount,
  };
}

export function useDataImportForm(
  checkFormatAction: DataImportStateAction,
  executeBatchAction: DataImportBatchStateAction,
) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validationState, setValidationState] = useState<DataImportActionState>(
    initialValidationState,
  );
  const [isChecking, setIsChecking] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [executionError, setExecutionError] = useState<string | null>(null);
  const [executionResult, setExecutionResult] =
    useState<ImportExecutionResult | null>(null);
  const [executionStatus, setExecutionStatus] = useState<
    "completed" | "importing" | null
  >(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const runTokenRef = useRef(0);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      runTokenRef.current += 1;
    };
  }, []);

  function resetAfterFileChange(file: File | null) {
    runTokenRef.current += 1;
    setSelectedFile(file);
    setValidationState(initialValidationState);
    setExecutionError(null);
    setExecutionResult(null);
    setExecutionStatus(null);
    setDownloadError(null);
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    resetAfterFileChange(event.target.files?.[0] ?? null);
  }

  async function handleCheckFormat() {
    if (!selectedFile || isChecking || isImporting) return;

    setIsChecking(true);
    setExecutionError(null);
    setExecutionResult(null);
    setExecutionStatus(null);
    setDownloadError(null);

    const formData = new FormData();
    formData.set("file", selectedFile);
    try {
      const nextState = await checkFormatAction({}, formData);
      if (mountedRef.current) setValidationState(nextState);
    } finally {
      if (mountedRef.current) setIsChecking(false);
    }
  }

  async function handleStartImport() {
    if (
      !selectedFile ||
      !validationState.result?.ok ||
      isChecking ||
      isImporting
    ) {
      return;
    }

    const totalCount =
      validationState.result.summary.incomeExpenseCount +
      validationState.result.summary.transferCount;
    let aggregate = createEmptyExecutionResult(totalCount);
    let offset = 0;
    const runToken = runTokenRef.current + 1;
    runTokenRef.current = runToken;
    setExecutionError(null);
    setDownloadError(null);
    setExecutionResult(aggregate);
    setExecutionStatus("importing");
    setIsImporting(true);

    try {
      while (mountedRef.current && runTokenRef.current === runToken) {
        const formData = new FormData();
        formData.set("file", selectedFile);
        formData.set("offset", String(offset));
        const state = await executeBatchAction({}, formData);

        if (!mountedRef.current || runTokenRef.current !== runToken) return;
        if (state.error || !state.batch) {
          setExecutionError(
            state.error ?? dataImportExecutionMessages.downloadFailed,
          );
          return;
        }

        aggregate = {
          details: [...aggregate.details, ...state.batch.details],
          duplicateCount:
            aggregate.duplicateCount + state.batch.duplicateCount,
          failureCount: aggregate.failureCount + state.batch.failureCount,
          processedCount: aggregate.processedCount + state.batch.processedCount,
          rowResults: [...aggregate.rowResults, ...state.batch.rowResults],
          successCount: aggregate.successCount + state.batch.successCount,
          totalCount: state.batch.totalCount,
        };
        setExecutionResult(aggregate);
        offset = state.batch.nextOffset;

        if (state.batch.done) {
          setExecutionStatus("completed");
          return;
        }
      }
    } finally {
      if (mountedRef.current && runTokenRef.current === runToken) {
        setIsImporting(false);
      }
    }
  }

  async function handleDownloadResult() {
    if (!selectedFile || !executionResult || executionStatus !== "completed") {
      return;
    }

    setIsDownloading(true);
    setDownloadError(null);
    try {
      const output = await buildDataImportResultWorkbook(
        await selectedFile.arrayBuffer(),
        executionResult.rowResults,
      );
      const blob = new Blob([output], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = buildDataImportResultFileName(selectedFile.name);
      anchor.click();
      URL.revokeObjectURL(url);
    } catch {
      if (mountedRef.current) {
        setDownloadError(dataImportExecutionMessages.downloadFailed);
      }
    } finally {
      if (mountedRef.current) setIsDownloading(false);
    }
  }

  return {
    downloadError,
    executionError,
    executionResult,
    executionStatus,
    handleCheckFormat,
    handleDownloadResult,
    handleFileChange,
    handleStartImport,
    isChecking,
    isDownloading,
    isImporting,
    selectedFileName: selectedFile?.name ?? null,
    validationState,
  };
}
