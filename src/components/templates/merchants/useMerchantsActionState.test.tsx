import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { MerchantActionState, MerchantStateAction } from "types/merchants";

import { useMerchantsActionState } from "./useMerchantsActionState";

afterEach(cleanup);

function ActionStateHarness({ action }: { action: MerchantStateAction }) {
  const result = useMerchantsActionState(action, {
    operation: "setPreferred",
  });

  return (
    <form action={result.action}>
      <input name="merchantId" type="hidden" value="merchant-1" />
      <input name="aliasId" type="hidden" value="alias-1" />
      <button disabled={result.pending} type="submit">
        切换显示名
      </button>
      <span data-testid="action-state">
        {result.state.success ?? result.state.error ?? ""}
      </span>
    </form>
  );
}

describe("useMerchantsActionState", () => {
  it("保留成功返回态供当前页面显示反馈", async () => {
    const action = vi.fn<MerchantStateAction>(
      async (_previousState, formData) => {
        expect(formData.get("__merchantSubmissionToken")).toBeNull();
        return { success: "显示名切换成功" };
      },
    );

    render(<ActionStateHarness action={action} />);
    fireEvent.click(screen.getByRole("button", { name: "切换显示名" }));

    await waitFor(() =>
      expect(screen.getByTestId("action-state")).toHaveTextContent(
        "显示名切换成功",
      ),
    );

    expect(action).toHaveBeenCalledOnce();
    const formData = action.mock.calls[0][1];
    expect(formData.get("merchantId")).toBe("merchant-1");
    expect(formData.get("aliasId")).toBe("alias-1");
    expect(screen.getByRole("button", { name: "切换显示名" })).toBeEnabled();
  });

  it("请求处理中忽略重复提交并在结束后恢复", async () => {
    let finish!: (state: MerchantActionState) => void;
    const action = vi.fn<MerchantStateAction>(
      () =>
        new Promise<MerchantActionState>((resolve) => {
          finish = resolve;
        }),
    );

    render(<ActionStateHarness action={action} />);
    const submit = screen.getByRole("button", { name: "切换显示名" });

    fireEvent.click(submit);
    await waitFor(() => expect(submit).toBeDisabled());
    fireEvent.click(submit);
    expect(action).toHaveBeenCalledOnce();

    await act(async () => {
      finish({ error: "无法切换显示名", errorKey: "failure-1" });
    });

    await waitFor(() => expect(submit).toBeEnabled());
    expect(screen.getByTestId("action-state")).toHaveTextContent(
      "无法切换显示名",
    );
  });
});
