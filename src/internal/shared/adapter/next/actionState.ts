import type { ActionState } from "types/actions";

/** Server Action 失败态：每次生成新的 errorKey，确保连续相同的失败也能再次触发反馈。 */
export function createErrorState(message: string): ActionState {
  return { error: message, errorKey: crypto.randomUUID() };
}

/** Server Action 成功态：每次生成新的 successKey，确保连续相同的成功也能再次触发反馈。 */
export function createSuccessState(message: string): ActionState {
  return { success: message, successKey: crypto.randomUUID() };
}
