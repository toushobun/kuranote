import type { Context } from "hono";

import type { AppEnv } from "internal/appEnv";

type ValidationTarget = "json" | "param" | "query";
type ControllerValidation = Partial<Record<ValidationTarget, unknown>>;
type PresentValidation<TValidation extends ControllerValidation> = {
  [TTarget in keyof TValidation]-?: Exclude<TValidation[TTarget], undefined>;
};

/**
 * Controller 只声明自己消费的校验结果类型，不反向依赖 Router 的 Route Contract。
 * Router 的 openapi() 调用仍负责校验 Handler 与 Route Contract 是否兼容。
 */
export type ControllerContext<
  TValidation extends ControllerValidation = Record<never, never>,
> = Context<
  AppEnv,
  string,
  {
    in: PresentValidation<TValidation>;
    out: PresentValidation<TValidation>;
  }
>;
