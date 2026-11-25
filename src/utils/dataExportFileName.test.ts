import { describe, expect, it } from "vitest";
import { buildDataExportFileName } from "./dataExportFileName";

describe("buildDataExportFileName", () => {
  it("按设备自然时间生成文件名并替换非法字符", () => {
    expect(
      buildDataExportFileName("家庭/账本", new Date(2026, 10, 25, 14, 50, 30)),
    ).toBe("KuraNote-家庭_账本-20261125-145030.xlsx");
  });
  it("账本名清理后为空时使用统一兜底文案", () => {
    expect(
      buildDataExportFileName("... ", new Date(2026, 10, 25, 14, 50, 30)),
    ).toBe("KuraNote-账本-20261125-145030.xlsx");
  });
});
