import { redirect } from "next/navigation";

import { saveAndLeaveField } from "config/unsavedChanges";
import { unsavedChangesMessages } from "config/unsavedChangesMessages";
import type { ActionState } from "types/actions";

/** Server Action 失败态：每次生成新的 errorKey，确保连续相同的失败也能再次触发反馈。 */
export function createErrorState(message: string): ActionState {
  return { error: message, errorKey: crypto.randomUUID() };
}

/** Server Action 成功态：每次生成新的 successKey，确保连续相同的成功也能再次触发反馈。 */
export function createSuccessState(message: string): ActionState {
  return { success: message, successKey: crypto.randomUUID() };
}

/** 只在业务保存和缓存失效成功后调用。 */
export function redirectAfterGuardedSave(formData: FormData, href: string) {
  if (formData.get(saveAndLeaveField) === "true")
    return createSuccessState(unsavedChangesMessages.saveSuccess);
  redirect(href);
}
