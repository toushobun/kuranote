/**
 * 浏览器端读取同源 API 的 JSON。网络错误、非 2xx 或无法解析时返回 null，
 * 调用方按「没有数据」降级；请求被取消时同样返回 null。
 */
export async function fetchClientJson<T>(
  url: string,
  signal?: AbortSignal,
): Promise<T | null> {
  try {
    const response = await fetch(url, {
      credentials: "same-origin",
      headers: { accept: "application/json" },
      signal,
    });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}
