export type ServerAction = (formData: FormData) => void | Promise<void>;

export type BaseActionState = {
  error?: string;
  success?: string;
};

/**
 * Server Action 最常见的状态形状。errorKey / successKey 每次失败 / 成功生成新的随机值，
 * 仅用于区分连续发生的反馈，不是稳定业务错误码。
 */
export type ActionState = BaseActionState & {
  errorKey?: string;
  successKey?: string;
};
