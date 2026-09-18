"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";

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
import {
  computeDisplayProcessed,
  initialBatchSizeGuess,
  initialEstimatedBatchDurationMs,
  simulatedImportProgressTickIntervalMs,
  toProgressPercentage,
  updateEstimatedBatchDuration,
} from "utils/simulatedImportProgress";

const initialValidationState: DataImportActionState = {};

function createEmptyExecutionResult(totalCount: number): ImportExecutionResult {
  return {
    details: [],
    duplicateCount: 0,
    failureCount: 0,
    holderMissingCount: 0,
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
  const [displayProgress, setDisplayProgress] = useState<number | null>(null);
  const [displayProcessedCount, setDisplayProcessedCount] = useState<
    number | null
  >(null);
  const mountedRef = useRef(true);
  const runTokenRef = useRef(0);
  const estimatedBatchDurationRef = useRef(initialEstimatedBatchDurationMs);
  const observedBatchSizeRef = useRef<number | null>(null);

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
    setDisplayProgress(null);
    setDisplayProcessedCount(null);
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
    const timeZoneOffsetMinutes = new Date().getTimezoneOffset();
    const runToken = runTokenRef.current + 1;
    runTokenRef.current = runToken;
    estimatedBatchDurationRef.current = initialEstimatedBatchDurationMs;
    observedBatchSizeRef.current = null;
    setExecutionError(null);
    setDownloadError(null);
    setExecutionResult(aggregate);
    setExecutionStatus("importing");
    // 百分比与预测行数出自同一次计算，统一经此函数写入，避免只更新其中一处。
    function applyDisplayProcessed(processed: number) {
      setDisplayProcessedCount(processed);
      setDisplayProgress(toProgressPercentage(processed, totalCount));
    }
    applyDisplayProcessed(0);
    setIsImporting(true);

    try {
      while (mountedRef.current && runTokenRef.current === runToken) {
        const confirmedProcessed = aggregate.processedCount;
        const pendingBatchSize = Math.min(
          observedBatchSizeRef.current ?? initialBatchSizeGuess,
          totalCount - confirmedProcessed,
        );
        const batchStartedAt = performance.now();
        let state: Awaited<ReturnType<DataImportBatchStateAction>>;

        let tickTimer: ReturnType<typeof setInterval> | undefined;
        try {
          tickTimer = setInterval(() => {
            if (!mountedRef.current || runTokenRef.current !== runToken) {
              return;
            }
            const elapsedMs = performance.now() - batchStartedAt;
            applyDisplayProcessed(
              computeDisplayProcessed({
                confirmedProcessed,
                elapsedMs,
                estimatedDurationMs: estimatedBatchDurationRef.current,
                pendingBatchSize,
              }),
            );
          }, simulatedImportProgressTickIntervalMs);

          const formData = new FormData();
          formData.set("file", selectedFile);
          formData.set("offset", String(offset));
          formData.set("timeZoneOffsetMinutes", String(timeZoneOffsetMinutes));
          state = await executeBatchAction({}, formData);

          estimatedBatchDurationRef.current = updateEstimatedBatchDuration(
            estimatedBatchDurationRef.current,
            performance.now() - batchStartedAt,
          );
        } finally {
          if (tickTimer !== undefined) clearInterval(tickTimer);
        }

        if (!mountedRef.current || runTokenRef.current !== runToken) return;
        if (state.error || !state.batch) {
          setExecutionError(
            state.error ?? dataImportExecutionMessages.downloadFailed,
          );
          setExecutionStatus(null);
          return;
        }

        aggregate = {
          details: [...aggregate.details, ...state.batch.details],
          duplicateCount: aggregate.duplicateCount + state.batch.duplicateCount,
          failureCount: aggregate.failureCount + state.batch.failureCount,
          holderMissingCount:
            aggregate.holderMissingCount + state.batch.holderMissingCount,
          processedCount: aggregate.processedCount + state.batch.processedCount,
          rowResults: [...aggregate.rowResults, ...state.batch.rowResults],
          successCount: aggregate.successCount + state.batch.successCount,
          totalCount: state.batch.totalCount,
        };
        setExecutionResult(aggregate);
        applyDisplayProcessed(aggregate.processedCount);
        offset = state.batch.nextOffset;
        if (!state.batch.done) {
          observedBatchSizeRef.current = state.batch.processedCount;
        }

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
    displayProcessedCount,
    displayProgress,
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
