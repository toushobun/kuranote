import { describe, expect, it } from "vitest";
import { getPresetSelection } from "./presetSelection";
describe("presetSelection", () => {
  it("选择结果只包含可添加项目，去重并剔除未知 key 与已添加项目", () => {
    expect(
      getPresetSelection(
        [{ key: "a" }, { key: "b" }, { key: "a" }],
        ["a", "b", "unknown"],
        ["a"],
      ),
    ).toEqual(["b"]);
  });
});
