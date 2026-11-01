"use server";

import { redirect } from "next/navigation";

export async function save(_previous, formData) {
  if (String(formData.get("name") ?? "").includes("失败")) {
    return { error: "验证用保存失败", errorKey: "probe-failure" };
  }
  redirect("/?saved=1");
}
