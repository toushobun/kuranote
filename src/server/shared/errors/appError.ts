export type AppErrorOptions = {
  details?: unknown;
};

/**
 * 统一应用错误基类。Repository / Service 只应抛出本文件定义的子类，
 * 不得把 Supabase / PostgreSQL 原始错误直接暴露给上层。
 */
export class AppError extends Error {
  readonly code: string;
  readonly details?: unknown;

  constructor(code: string, message: string, options: AppErrorOptions = {}) {
    super(message);
    this.name = new.target.name;
    this.code = code;
    this.details = options.details;
  }
}

export class ValidationError extends AppError {}
export class AuthenticationError extends AppError {}
export class AuthorizationError extends AppError {}
export class NotFoundError extends AppError {}
export class ConflictError extends AppError {}
export class RateLimitError extends AppError {}
export class RepositoryError extends AppError {}
