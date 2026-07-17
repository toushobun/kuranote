import { RepositoryError } from "server/shared/errors/appError";

export type SupabaseErrorLike = {
  code?: string | null;
  message?: string | null;
};

/**
 * 把 Supabase / PostgreSQL 原始错误转换为安全的 RepositoryError，
 * 不向 Service / Controller / 客户端暴露原始错误信息。
 *
 * 调用方应在转换前先用 shared/logging 记录原始错误，供服务端排查。
 */
export function toRepositoryError(
  code: string,
  message: string,
): RepositoryError {
  return new RepositoryError(code, message);
}
