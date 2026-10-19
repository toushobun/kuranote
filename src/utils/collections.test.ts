import { describe, expect, it } from "vitest";

import {
  chunkArray,
  groupByKey,
  mergeUniqueById,
  paginateItems,
} from "./collections";

describe("groupByKey", () => {
  it("按 key 分组并保持组内原有顺序", () => {
    const grouped = groupByKey(
      [
        { id: "a", recordId: "r1" },
        { id: "b", recordId: "r2" },
        { id: "c", recordId: "r1" },
      ],
      (value) => value.recordId,
    );

    expect([...grouped.keys()]).toEqual(["r1", "r2"]);
    expect(grouped.get("r1")?.map((value) => value.id)).toEqual(["a", "c"]);
    expect(grouped.get("r2")?.map((value) => value.id)).toEqual(["b"]);
  });
});

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

describe("chunkArray", () => {
  it("按固定大小切段，最后一段可以不满", () => {
    expect(chunkArray([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  it("空数组返回空结果", () => {
    expect(chunkArray([], 3)).toEqual([]);
  });
});
