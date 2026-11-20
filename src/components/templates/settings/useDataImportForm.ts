"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";

import { dataImportExecutionMessages } from "config/dataImportExportMessages";
import { prepareImportPhotoBatch } from "utils/dataImportPhotoBatch";
import type { DataImportPhotoPreviewRow } from "organisms/settings/DataImportPhotoPreview/DataImportPhotoPreview";
import type { AccountImportHolder } from "internal/account";
import {
  analyzeImportFile,
  collectHolderMappingCandidates,
  dataImportErrorCodes,
  dataImportErrorMessages,
  importBatchSize,
  type EmbeddedWorksheetPhoto,
  type ImportExecutionResult,
  type ImportExecutionUnit,
  type ImportHolderMapping,
  type ImportHolderMappingCandidate,
} from "internal/dataImport";
import type {
  DataImportActionState,
  DataImportBatchStateAction,
} from "types/dataImport";
import {
  buildDataImportResultFileName,
  buildDataImportResultWorkbook,
} from "utils/dataImportResultWorkbook";
import {
  computeDisplayProcessed,
  initialEstimatedBatchDurationMs,
  simulatedImportProgressTickIntervalMs,
  toProgressPercentage,
  updateEstimatedBatchDuration,
} from "utils/simulatedImportProgress";

const initialValidationState: DataImportActionState = {};

const executionFailedMessage =
  dataImportErrorMessages[dataImportErrorCodes.executionFailed];

function createEmptyExecutionResult(totalCount: number): ImportExecutionResult {
  return {
    createdPlaceholderCount: 0,
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
  holderMembers: AccountImportHolder[] = [],
  ledgerId?: string,
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
  // 无法唯一匹配账本成员的持有人姓名；非空时「开始导入」前需要先做持有人映射。
  const [holderMappingCandidates, setHolderMappingCandidates] = useState<
    ImportHolderMappingCandidate[]
  >([]);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  // 仅用于进度条的展示值：批次等待期间按预测平滑推进，批次返回后对齐真实进度。
  const [displayProgress, setDisplayProgress] = useState<number | null>(null);
  const [photoUploadProgress, setPhotoUploadProgress] = useState<{
    done: number;
    total: number;
  } | null>(null);
  const mountedRef = useRef(true);
  const runTokenRef = useRef(0);
  const estimatedBatchDurationRef = useRef(initialEstimatedBatchDurationMs);
  // 浏览器端「检查格式」解析出的全部执行单元，「开始导入」按批切片发给服务端。
  const unitsRef = useRef<ImportExecutionUnit[]>([]);
  const photosRef = useRef<Map<number, EmbeddedWorksheetPhoto[]>>(new Map());
  const [photoPreviewRows, setPhotoPreviewRows] = useState<
    DataImportPhotoPreviewRow[]
  >([]);

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
    photosRef.current.clear();
    setPhotoPreviewRows([]);
    setSelectedFile(file);
    setIsChecking(false);
    setValidationState(initialValidationState);
    setHolderMappingCandidates([]);
    setExecutionError(null);
    setExecutionResult(null);
    setExecutionStatus(null);
    setDownloadError(null);
    setDisplayProgress(null);
    setPhotoUploadProgress(null);
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    resetAfterFileChange(event.target.files?.[0] ?? null);
  }

  async function handleCheckFormat() {
    if (!selectedFile || isChecking || isImporting) return;

    const checkToken = runTokenRef.current;
    setIsChecking(true);
    setExecutionError(null);
    setExecutionResult(null);
    setExecutionStatus(null);
    setDownloadError(null);

    try {
      const { result, units, photosByRow } =
        await analyzeImportFile(selectedFile);
      // 换文件或退出页面后，旧解析结果不能覆盖新文件的单元及照片。
      if (!mountedRef.current || runTokenRef.current !== checkToken) return;
      unitsRef.current = units;
      photosRef.current = photosByRow ?? new Map();
      setPhotoPreviewRows(
        result.ok && photosByRow
          ? units.flatMap((unit) => {
              if (unit.kind !== "incomeExpense") return [];
              const rowNumber = unit.group.rowNumbers[0];
              const photos = photosByRow.get(rowNumber);
              if (!photos?.length) return [];
              const first = unit.group.items[0];
              return [
                {
                  amount:
                    Math.round(
                      unit.group.items.reduce(
                        (total, item) => total + item.amount,
                        0,
                      ) * 100,
                    ) / 100,
                  merchantName: first.merchantName,
                  photos,
                  rowNumber,
                  transactionAt: first.transactionAt,
                },
              ];
            })
          : [],
      );
      if (mountedRef.current) {
        setHolderMappingCandidates(
          result.ok ? collectHolderMappingCandidates(units, holderMembers) : [],
        );
        setValidationState({ result });
      }
    } catch {
      if (mountedRef.current && runTokenRef.current === checkToken) {
        setValidationState({
          error: dataImportErrorMessages[dataImportErrorCodes.validationFailed],
        });
      }
    } finally {
      if (mountedRef.current && runTokenRef.current === checkToken) {
        setIsChecking(false);
      }
    }
  }

  async function startImport(holderMapping: ImportHolderMapping) {
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
    // 首批可能携带「新建待邀请成员」意图；服务端创建后返回已解析的映射，后续批次
    // 只提交解析结果，不再重复提交新建意图。请求失败时不自动重试。
    let currentHolderMapping = holderMapping;
    let aggregate = createEmptyExecutionResult(totalCount);
    let offset = 0;
    let uploadedPhotoCount = 0;
    const totalPhotos = [...photosRef.current.values()].reduce(
      (total, photos) => total + photos.length,
      0,
    );
    const timeZoneOffsetMinutes = new Date().getTimezoneOffset();
    const runToken = runTokenRef.current + 1;
    runTokenRef.current = runToken;
    estimatedBatchDurationRef.current = initialEstimatedBatchDurationMs;
    setExecutionError(null);
    setDownloadError(null);
    setExecutionResult(aggregate);
    setExecutionStatus("importing");
    setDisplayProgress(0);
    setPhotoUploadProgress(null);
    // 只有表头、没有数据行的模板：无需请求服务端，直接按 0 条完成。
    if (totalCount === 0) {
      setExecutionStatus("completed");
      return;
    }
    setIsImporting(true);

    try {
      while (mountedRef.current && runTokenRef.current === runToken) {
        const confirmedProcessed = aggregate.processedCount;
        const batchUnits = units.slice(offset, offset + importBatchSize);
        const batchStartedAt = performance.now();
        let state: Awaited<ReturnType<DataImportBatchStateAction>>;

        let tickTimer: ReturnType<typeof setInterval> | undefined;
        try {
          tickTimer = setInterval(() => {
            if (!mountedRef.current || runTokenRef.current !== runToken) {
              return;
            }
            setDisplayProgress(
              toProgressPercentage(
                computeDisplayProcessed({
                  confirmedProcessed,
                  elapsedMs: performance.now() - batchStartedAt,
                  estimatedDurationMs: estimatedBatchDurationRef.current,
                  pendingBatchSize: batchUnits.length,
                }),
                totalCount,
              ),
            );
          }, simulatedImportProgressTickIntervalMs);

          if (
            batchUnits.some(
              (unit) =>
                unit.kind === "incomeExpense" &&
                (photosRef.current.get(unit.group.rowNumbers[0])?.length ?? 0) >
                  0,
            )
          ) {
            setPhotoUploadProgress({
              done: uploadedPhotoCount,
              total: totalPhotos,
            });
          }
          const prepared = await prepareImportPhotoBatch(
            batchUnits,
            photosRef.current,
            ledgerId,
            undefined,
            () => {
              if (!mountedRef.current || runTokenRef.current !== runToken)
                return;
              uploadedPhotoCount += 1;
              setPhotoUploadProgress({
                done: uploadedPhotoCount,
                total: totalPhotos,
              });
            },
          );
          // 图片上传是额外的异步阶段：切换文件或离开页面后不能再提交数据。
          if (!mountedRef.current || runTokenRef.current !== runToken) return;
          setPhotoUploadProgress(null);
          const formData = new FormData();
          formData.set("units", JSON.stringify(prepared.units));
          formData.set("holderMapping", JSON.stringify(currentHolderMapping));
          formData.set("timeZoneOffsetMinutes", String(timeZoneOffsetMinutes));
          state =
            prepared.units.length > 0
              ? await executeBatchAction({}, formData)
              : {
                  batch: {
                    createdPlaceholderCount: 0,
                    details: [],
                    duplicateCount: 0,
                    failureCount: 0,
                    holderMissingCount: 0,
                    processedCount: 0,
                    rowResults: [],
                    successCount: 0,
                  },
                };
          if (state.batch) {
            state = {
              ...state,
              batch: {
                ...state.batch,
                details: [...prepared.failedDetails, ...state.batch.details],
                failureCount:
                  prepared.failedDetails.length + state.batch.failureCount,
                processedCount:
                  prepared.failedDetails.length + state.batch.processedCount,
                rowResults: [...prepared.failedRows, ...state.batch.rowResults],
              },
            };
          }

          estimatedBatchDurationRef.current = updateEstimatedBatchDuration(
            estimatedBatchDurationRef.current,
            performance.now() - batchStartedAt,
          );
        } finally {
          if (tickTimer !== undefined) clearInterval(tickTimer);
        }

        if (!mountedRef.current || runTokenRef.current !== runToken) return;
        if (state.error || !state.batch) {
          setExecutionError(state.error ?? executionFailedMessage);
          setExecutionStatus(null);
          return;
        }

        if (state.resolvedHolderMapping) {
          currentHolderMapping = state.resolvedHolderMapping;
        }
        aggregate = {
          createdPlaceholderCount:
            aggregate.createdPlaceholderCount +
            state.batch.createdPlaceholderCount,
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
        setDisplayProgress(
          toProgressPercentage(aggregate.processedCount, totalCount),
        );
        offset += batchUnits.length;

        if (offset >= totalCount) {
          setExecutionStatus("completed");
          return;
        }
      }
    } catch {
      // 网络中断、请求超时等导致某一批请求直接抛出：已写入的批次不会回滚，
      // 这里只负责让界面退出「导入中」并给出提示，避免一直停在转圈状态。
      if (mountedRef.current && runTokenRef.current === runToken) {
        setExecutionError(executionFailedMessage);
        setExecutionStatus(null);
      }
    } finally {
      if (mountedRef.current && runTokenRef.current === runToken) {
        setIsImporting(false);
        setPhotoUploadProgress(null);
      }
    }
  }

  function handleStartImport() {
    return startImport({});
  }

  /** 取消映射即放弃本次导入：保留已选文件，清掉解析结果，不向服务端发送任何请求。 */
  function handleCancelHolderMapping() {
    resetAfterFileChange(selectedFile);
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
      try {
        anchor.href = url;
        anchor.download = buildDataImportResultFileName(selectedFile.name);
        document.body.appendChild(anchor);
        anchor.click();
      } finally {
        anchor.remove();
        // Safari 等浏览器需要在开始下载之后再释放 Blob URL。
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
    } catch {
      if (mountedRef.current) {
        setDownloadError(dataImportExecutionMessages.downloadFailed);
      }
    } finally {
      if (mountedRef.current) setIsDownloading(false);
    }
  }

  return {
    displayProgress,
    downloadError,
    executionError,
    executionResult,
    executionStatus,
    handleCancelHolderMapping,
    handleCheckFormat,
    handleConfirmHolderMapping: startImport,
    handleDownloadResult,
    handleFileChange,
    handleStartImport,
    holderMappingCandidates,
    isChecking,
    isDownloading,
    isImporting,
    selectedFileName: selectedFile?.name ?? null,
    photoPreviewRows,
    photoUploadProgress,
    validationState,
  };
}
