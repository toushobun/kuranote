export type OpenApiErrorStatus = 400 | 401 | 403 | 404 | 409 | 429 | 500;

export const standardMutationErrorStatuses = [
  400, 401, 403, 404, 409, 500,
] as const satisfies readonly OpenApiErrorStatus[];

export const protectedMutationErrorStatuses = [
  400, 401, 403, 404, 500,
] as const satisfies readonly OpenApiErrorStatus[];

export const protectedReadErrorStatuses = [
  400, 401, 404, 500,
] as const satisfies readonly OpenApiErrorStatus[];

const defaultDescriptions: Record<OpenApiErrorStatus, string> = {
  400: "请求无效",
  401: "未登录",
  403: "无权限",
  404: "资源不存在",
  409: "资源冲突",
  429: "请求过于频繁",
  500: "服务异常",
};

type ErrorResponse<TSchema> = {
  content: { "application/json": { schema: TSchema } };
  description: string;
};

/**
 * 统一生成 OpenAPI 错误响应，模块只声明适用状态码和少量文案差异。
 */
export function createOpenApiErrorResponses<
  TSchema,
  const TStatuses extends readonly OpenApiErrorStatus[],
>(
  schema: TSchema,
  statuses: TStatuses,
  descriptionOverrides: Partial<Record<OpenApiErrorStatus, string>> = {},
): { [TStatus in TStatuses[number]]: ErrorResponse<TSchema> } {
  return Object.fromEntries(
    statuses.map((status) => [
      status,
      {
        content: { "application/json": { schema } },
        description:
          descriptionOverrides[status] ?? defaultDescriptions[status],
      },
    ]),
  ) as { [TStatus in TStatuses[number]]: ErrorResponse<TSchema> };
}
