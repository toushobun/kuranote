import { fireEvent, screen, waitFor } from "@testing-library/react";
import { expect, type Mock } from "vitest";

// 退款 / 报销关联 Picker 共用：打开选择器 → 切换到搜索 → 提交关键词并等待读取。
export async function searchLinkPickerCandidates({
  loadSearchPageAction,
  openButtonName,
  query,
}: {
  loadSearchPageAction: Mock;
  openButtonName: string;
  query: string;
}) {
  fireEvent.click(screen.getByRole("button", { name: openButtonName }));
  fireEvent.click(screen.getByRole("tab", { name: "搜索" }));
  const input = screen.getByLabelText("搜索关键词");
  fireEvent.change(input, { target: { value: query } });
  fireEvent.submit(input.closest("form") as HTMLFormElement);

  await waitFor(() => {
    expect(loadSearchPageAction).toHaveBeenCalledWith(query, 0);
  });
}
