"use server";

import type { ActionState } from "../../../../src/types/actions";

import { redirect } from "next/navigation";

export async function save(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (String(formData.get("name") ?? "").includes("失败")) {
    return { error: "验证用保存失败", errorKey: "probe-failure" };
  }
  redirect("/dashboard?saved=1");
}
