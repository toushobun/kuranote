import { describe, expect, it } from "vitest";

import { mergeUniqueById, paginateItems } from "./collections";

describe("mergeUniqueById", () => {
  it("追加不存在的 id 并保留已有顺序", () => {
    expect(
      mergeUniqueById(
        [
          { id: "a", label: "A" },
          { id: "b", label: "B" },
        ],
        [
          { id: "b", label: "B2" },
          { id: "c", label: "C" },
        ],
      ),
    ).toEqual([
      { id: "a", label: "A" },
      { id: "b", label: "B" },
      { id: "c", label: "C" },
    ]);
  });
});

describe("paginateItems", () => {
  it("按 offset 和 pageSize 切出分页并返回 nextOffset", () => {
    expect(paginateItems(["a", "b", "c", "d"], 1, 2)).toEqual({
      items: ["b", "c"],
      nextOffset: 3,
      totalCount: 4,
    });
  });

  it("最后一页没有 nextOffset", () => {
    expect(paginateItems(["a", "b", "c"], 2, 2)).toEqual({
      items: ["c"],
      nextOffset: null,
      totalCount: 3,
    });
  });

  it("负 offset 按 0 处理", () => {
    expect(paginateItems(["a", "b", "c"], -10, 2)).toEqual({
      items: ["a", "b"],
      nextOffset: 2,
      totalCount: 3,
    });
  });

  it("页大小为 0 时不返回 nextOffset", () => {
    expect(paginateItems(["a", "b", "c"], 0, 0)).toEqual({
      items: [],
      nextOffset: null,
      totalCount: 3,
    });
  });
});
