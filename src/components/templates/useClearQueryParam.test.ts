import { cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useClearQueryParam } from "./useClearQueryParam";

const replaceMock = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock }),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  window.history.replaceState(null, "", "/");
});

describe("useClearQueryParam", () => {
  it.each([
    {
      name: "删除全部同名参数并保留筛选参数与 hash",
      href: "/accounts?tag=one&result=created&tag=two&result=updated#list",
      param: "result",
      expected: "/accounts?tag=one&tag=two#list",
    },
    {
      name: "删除唯一参数后不留下问号",
      href: "/accounts?result=updated#list",
      param: "result",
      expected: "/accounts#list",
    },
    {
      name: "支持删除指定的其他参数",
      href: "/accounts?result=updated&page=2",
      param: "page",
      expected: "/accounts?result=updated",
    },
    {
      name: "目标参数不存在时仍按原行为替换当前地址",
      href: "/accounts#list",
      param: "result",
      expected: "/accounts#list",
    },
  ])("$name", ({ href, param, expected }) => {
    window.history.replaceState(null, "", href);
    const { result } = renderHook(() => useClearQueryParam(param));

    expect(replaceMock).not.toHaveBeenCalled();
    result.current();

    expect(replaceMock).toHaveBeenCalledExactlyOnceWith(expected, {
      scroll: false,
    });
  });

  it("调用时读取最新 URL", () => {
    window.history.replaceState(null, "", "/accounts?result=created");
    const { result } = renderHook(() => useClearQueryParam("result"));
    window.history.replaceState(
      null,
      "",
      "/accounts?result=updated&filter=active#latest",
    );

    result.current();

    expect(replaceMock).toHaveBeenCalledExactlyOnceWith(
      "/accounts?filter=active#latest",
      { scroll: false },
    );
  });
});
