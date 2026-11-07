"use server";

import type { ActionState } from "../../../../src/types/actions";
import { merchantPresetMessages } from "../../../../src/config/merchantPresetMessages";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { redirectAfterGuardedSave } from "../../../../src/internal/shared/adapter/next/actionState";

export async function save(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (String(formData.get("name") ?? "").includes("失败")) {
    return { error: "验证用保存失败", errorKey: "probe-failure" };
  }
  redirect("/dashboard?saved=1");
}

export async function saveReceipt(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (String(formData.get("note") ?? "").includes("失败")) {
    return { error: "验证用保存失败", errorKey: "probe-failure" };
  }
  revalidatePath("/receipt");
  revalidatePath("/new");
  return redirectAfterGuardedSave(formData, "/transactions?saved=1");
}

export async function createMerchant(
  _state: import("../../../../src/types/merchants").MerchantActionState,
  data: FormData,
): Promise<import("../../../../src/types/merchants").MerchantActionState> {
  return {
    createdMerchant: {
      id: "new-merchant",
      name: String(data.get("name")),
      icon_url: null,
      tags: [],
    },
  };
}
export async function createAccount(
  _state: import("../../../../src/types/accounts").AccountActionState,
  data: FormData,
): Promise<import("../../../../src/types/accounts").AccountActionState> {
  return {
    createdAccount: {
      id: "new-account",
      name: String(data.get("name")),
      currency: "JPY",
      type: "cash",
      holders: [],
    },
  };
}
export async function fetchMerchantIcon(): Promise<
  import("../../../../src/types/merchants").MerchantIconActionState
> {
  return {};
}

export async function loadPresets(): Promise<
  import("../../../../src/types/merchants").MerchantPresetLoadState
> {
  const { createMerchantPresetOptions } =
    await import("../../../../src/test/mocks/merchantPresets");
  return { options: createMerchantPresetOptions() };
}
export async function addPresets(
  _state: import("../../../../src/types/merchants").MerchantActionState,
  data: FormData,
): Promise<import("../../../../src/types/merchants").MerchantActionState> {
  return {
    success: merchantPresetMessages.success(data.getAll("selectedKeys").length),
  };
}

export async function saveMerchantDetails(
  previous: ActionState,
  data: FormData,
): Promise<ActionState> {
  if (data.get("presentation") === "dialog") {
    const { revalidatePath } = await import("next/cache");
    revalidatePath("/merchant-edit");
    return { success: "保存成功", successKey: String(Date.now()) };
  }
  return save(previous, data);
}
export async function saveAlias(): Promise<ActionState> {
  const { revalidatePath } = await import("next/cache");
  revalidatePath("/merchant-edit");
  return { success: "添加成功", successKey: String(Date.now()) };
}

export async function saveCategory(
  _previous: ActionState,
  data: FormData,
): Promise<ActionState> {
  if (String(data.get("name")).includes("失败"))
    return { error: "分类验证失败", errorKey: String(Date.now()) };
  const { revalidatePath } = await import("next/cache");
  revalidatePath("/category");
  return { success: "保存成功", successKey: String(Date.now()) };
}
export async function reorderCategory(): Promise<ActionState> {
  return {};
}

export async function saveLedgerSettings(
  _previous: ActionState,
  data: FormData,
): Promise<ActionState> {
  if (String(data.get("ledgerName")).includes("失败"))
    return { error: "账本设置验证失败", errorKey: String(Date.now()) };
  const { revalidatePath } = await import("next/cache");
  revalidatePath("/ledger-settings");
  return { success: "保存成功", successKey: String(Date.now()) };
}

export async function unusedLedgerInvite(): Promise<ActionState> {
  return {};
}
