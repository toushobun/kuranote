import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { MerchantActionState, MerchantStateAction } from "types/merchants";

import { useMerchantDisplayNameListAction } from "./useMerchantDisplayNameListAction";

afterEach(cleanup);

function ActionHarness({ action }: { action: MerchantStateAction }) {
  const result = useMerchantDisplayNameListAction(action);

  return (
    <>
      {[
        ["merchant-a", "alias-a"],
        ["merchant-b", "alias-b"],
      ].map(([merchantId, aliasId]) => (
        <form action={result.action} key={merchantId}>
          <input name="merchantId" type="hidden" value={merchantId} />
          <input name="aliasId" type="hidden" value={aliasId} />
          <button type="submit">切换{merchantId}</button>
        </form>
      ))}
      <span data-testid="feedback">
        {result.state.success ?? result.state.error ?? ""}
      </span>
    </>
  );
}

describe("useMerchantDisplayNameListAction", () => {
  it("阻止同商家重复请求、允许跨商家并发且只采用最新操作反馈", async () => {
    const resolvers = new Map<string, (state: MerchantActionState) => void>();
    const action = vi.fn<MerchantStateAction>(
      async (_previousState, formData) =>
        new Promise<MerchantActionState>((resolve) => {
          resolvers.set(String(formData.get("merchantId")), resolve);
        }),
    );

    render(<ActionHarness action={action} />);
    const merchantA = screen.getByRole("button", { name: "切换merchant-a" });
    const merchantB = screen.getByRole("button", { name: "切换merchant-b" });

    fireEvent.click(merchantA);
    await waitFor(() => expect(action).toHaveBeenCalledTimes(1));

    fireEvent.click(merchantA);
    expect(action).toHaveBeenCalledTimes(1);

    fireEvent.click(merchantB);
    await waitFor(() => expect(action).toHaveBeenCalledTimes(2));

    await act(async () => {
      resolvers.get("merchant-a")?.({ success: "A 成功" });
    });
    expect(screen.getByTestId("feedback")).toHaveTextContent("");

    await act(async () => {
      resolvers.get("merchant-b")?.({ success: "B 成功" });
    });
    await waitFor(() =>
      expect(screen.getByTestId("feedback")).toHaveTextContent("B 成功"),
    );
  });
});
