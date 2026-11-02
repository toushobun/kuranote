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
export async function addPresets(): Promise<
  import("../../../../src/types/merchants").MerchantActionState
> {
  return {};
}
