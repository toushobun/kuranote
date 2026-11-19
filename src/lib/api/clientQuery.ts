import { executeClientMutation } from "./clientMutation";

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

/** 读取需要展示服务端错误的 JSON 响应，并校验成功响应的数据。 */
export async function executeClientJsonRequest<T>({
  errorMessage,
  init,
  parse,
  url,
}: {
  errorMessage: string;
  init: RequestInit;
  parse: (body: unknown) => T | undefined;
  url: string;
}): Promise<T> {
  let data: T | undefined;
  const result = await executeClientMutation({
    fallbackErrorMessage: errorMessage,
    init,
    networkErrorMessage: errorMessage,
    onSuccess: async (response) => {
      const body: unknown = await response.json().catch(() => null);
      data = parse(body);
    },
    url,
  });
  if (!result.ok) throw new Error(result.errorMessage);
  if (data === undefined) throw new Error(errorMessage);
  return data;
}
