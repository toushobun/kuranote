import { describe, expect, it } from "vitest";
import { getPresetSelection } from "./presetSelection";
describe("presetSelection", () => {
  it("全选只包含可添加项目，去重并剔除未知 key 与已添加项目", () => {
    expect(
      getPresetSelection(
        [{ key: "a" }, { key: "b" }, { key: "a" }],
        ["a", "b", "unknown"],
        ["a"],
      ),
    ).toEqual({
      allSelected: true,
      availableKeys: ["b"],
      keys: ["b"],
      toggleAllKeys: [],
    });
  });
  it("部分选择切换为所有可添加项目，没有可添加项目时不生成新选择", () => {
    expect(
      getPresetSelection([{ key: "a" }, { key: "b" }], [], ["a"]).toggleAllKeys,
    ).toEqual(["b"]);
    expect(
      getPresetSelection([{ key: "a" }], ["a"], ["a"]).toggleAllKeys,
    ).toEqual([]);
  });
});
