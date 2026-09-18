// 数据导入批次等待期间的预测式进度动画：纯计算逻辑，不依赖组件或计时器。
export const simulatedImportProgressCap = 0.95;
export const simulatedImportProgressGrowthRate = 3.5;
export const simulatedImportProgressTickIntervalMs = 200;
export const initialEstimatedBatchDurationMs = 3000;
export const initialBatchSizeGuess = 25;
export const estimatedBatchDurationEmaWeight = 0.5;

export function computeBatchProgressRatio(
  elapsedMs: number,
  estimatedDurationMs: number,
): number {
  const safeDurationMs =
    estimatedDurationMs > 0 ? estimatedDurationMs : Number.EPSILON;
  const ratio =
    simulatedImportProgressCap *
    (1 -
      Math.exp(
        (-simulatedImportProgressGrowthRate * elapsedMs) / safeDurationMs,
      ));
  return Math.min(simulatedImportProgressCap, Math.max(0, ratio));
}

export function computeDisplayProcessed(input: {
  confirmedProcessed: number;
  elapsedMs: number;
  estimatedDurationMs: number;
  pendingBatchSize: number;
}): number {
  const ratio = computeBatchProgressRatio(
    input.elapsedMs,
    input.estimatedDurationMs,
  );
  return input.confirmedProcessed + input.pendingBatchSize * ratio;
}

export function updateEstimatedBatchDuration(
  previousEstimateMs: number,
  actualDurationMs: number,
): number {
  return (
    estimatedBatchDurationEmaWeight * previousEstimateMs +
    (1 - estimatedBatchDurationEmaWeight) * actualDurationMs
  );
}

export function toProgressPercentage(
  processed: number,
  totalCount: number,
): number {
  return totalCount === 0 ? 0 : Math.min(100, (processed / totalCount) * 100);
}
