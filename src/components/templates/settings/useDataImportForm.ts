"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";

import { dataImportExecutionMessages } from "config/dataImportExportMessages";
import {
  analyzeImportFile,
  dataImportErrorCodes,
  getDataImportErrorMessage,
  importBatchSize,
  type ImportExecutionResult,
  type ImportExecutionUnit,
} from "internal/dataImport";
import type {
  DataImportActionState,
  DataImportBatchStateAction,
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
    holderMissingCount: 0,
    processedCount: 0,
    rowResults: [],
    successCount: 0,
    totalCount,
  };
}

export function useDataImportForm(
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
  // 浏览器端「检查格式」解析出的全部执行单元，「开始导入」按批切片发给服务端。
  const unitsRef = useRef<ImportExecutionUnit[]>([]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      runTokenRef.current += 1;
    };
  }, []);

  function resetAfterFileChange(file: File | null) {
    runTokenRef.current += 1;
    unitsRef.current = [];
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

    try {
      const { result, units } = await analyzeImportFile(selectedFile);
      unitsRef.current = units;
      if (mountedRef.current) setValidationState({ result });
    } catch {
      if (mountedRef.current) {
        setValidationState({
          error:
            getDataImportErrorMessage(dataImportErrorCodes.validationFailed) ??
            undefined,
        });
      }
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

    const units = unitsRef.current;
    const totalCount = units.length;
    let aggregate = createEmptyExecutionResult(totalCount);
    let offset = 0;
    const timeZoneOffsetMinutes = new Date().getTimezoneOffset();
    const runToken = runTokenRef.current + 1;
    runTokenRef.current = runToken;
    setExecutionError(null);
    setDownloadError(null);
    setExecutionResult(aggregate);
    setExecutionStatus("importing");
    // 只有表头、没有数据行的模板：无需请求服务端，直接按 0 条完成。
    if (totalCount === 0) {
      setExecutionStatus("completed");
      return;
    }
    setIsImporting(true);

    try {
      while (mountedRef.current && runTokenRef.current === runToken) {
        const batchUnits = units.slice(offset, offset + importBatchSize);
        const formData = new FormData();
        formData.set("units", JSON.stringify(batchUnits));
        formData.set("timeZoneOffsetMinutes", String(timeZoneOffsetMinutes));
        const state = await executeBatchAction({}, formData);

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
          totalCount,
        };
        setExecutionResult(aggregate);
        offset += batchUnits.length;

        if (offset >= totalCount) {
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
