/** 仅在提供计时回调时采样；请求失败也上报已耗时，不改变原始异常。 */
export async function measureReadStage<T, Stage extends string>(
  stage: Stage,
  read: () => Promise<T>,
  onTiming?: (stage: Stage, elapsedMs: number) => void,
): Promise<T> {
  if (!onTiming) return read();
  const startedAt = performance.now();
  try {
    return await read();
  } finally {
    onTiming(stage, performance.now() - startedAt);
  }
}
