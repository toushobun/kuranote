import {
  act,
  fireEvent,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { backFromGuard } from "./mockGuardHistory";

/** 新接入页面共用真实守卫交互，页面自己负责找到并修改可保存字段。 */
export function describeUnsavedFormPage({
  render,
  change,
  restore,
}: {
  render: () => void;
  change: () => void;
  restore: () => void;
}) {
  describe("未保存离开守卫", () => {
    it("后退继续编辑保留输入，放弃只真正返回一次", async () => {
      render();
      change();
      await backFromGuard();
      const dialog = await screen.findByRole("dialog", { name: "尚未保存" });
      expect(
        within(dialog).getByRole("button", { name: "保存" }),
      ).toBeVisible();
      fireEvent.click(within(dialog).getByRole("button", { name: "继续编辑" }));
      await waitFor(() =>
        expect(screen.queryByRole("dialog", { name: "尚未保存" })).toBeNull(),
      );
      await backFromGuard();
      fireEvent.click(screen.getByRole("button", { name: "放弃修改" }));
      await waitFor(() => expect(window.history.back).toHaveBeenCalledTimes(3));
      expect(window.history.pushState).toHaveBeenCalledOnce();
    });

    it("改回初始值后刷新不提示，前进不复活失效确认", async () => {
      render();
      change();
      await waitFor(() =>
        expect(window.history.state?.kuranoteUnsavedChanges?.position).toBe(
          "sentinel",
        ),
      );
      const dirtyUnload = new Event("beforeunload", { cancelable: true });
      window.dispatchEvent(dirtyUnload);
      expect(dirtyUnload.defaultPrevented).toBe(true);
      restore();
      await waitFor(() =>
        expect(window.history.state?.kuranoteUnsavedChanges?.position).toBe(
          "base",
        ),
      );
      const cleanUnload = new Event("beforeunload", { cancelable: true });
      window.dispatchEvent(cleanUnload);
      expect(cleanUnload.defaultPrevented).toBe(false);
      await act(async () => window.history.forward());
      await waitFor(() =>
        expect(window.history.state?.kuranoteUnsavedChanges?.position).toBe(
          "base",
        ),
      );
      expect(screen.queryByRole("dialog", { name: "尚未保存" })).toBeNull();
      expect(window.history.pushState).toHaveBeenCalledOnce();
    });
    it("页内返回链接也使用公共确认，继续编辑后可以还原", async () => {
      render();
      change();
      const link = document.querySelector<HTMLAnchorElement>("a[href]");
      if (!link) throw new Error("页面没有站内返回链接");
      fireEvent.click(link);
      const dialog = screen.getByRole("dialog", { name: "尚未保存" });
      fireEvent.click(within(dialog).getByRole("button", { name: "继续编辑" }));
      await waitFor(() =>
        expect(screen.queryByRole("dialog", { name: "尚未保存" })).toBeNull(),
      );
      restore();
      await waitFor(() =>
        expect(window.history.state?.kuranoteUnsavedChanges?.position).toBe(
          "base",
        ),
      );
    });
  });
}
