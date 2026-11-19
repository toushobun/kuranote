// @vitest-environment node
import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";
import { readWorksheetPhotos } from "./readWorksheetPhotos";

async function sheetWithPictures(
  pictures: { col: number; row: number; data?: string }[],
) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("收支");
  sheet.addRow(["日期", "金额", "照片1", "照片2", "照片3", "照片4", "照片5"]);
  sheet.addRow(["2026-01-01 12:00:00", "30", "", ""]);
  const imageId = workbook.addImage({ base64: "/9j/2Q==", extension: "jpeg" });
  for (const picture of pictures) {
    const id = picture.data
      ? workbook.addImage({ base64: picture.data, extension: "jpeg" })
      : imageId;
    sheet.addImage(id, {
      tl: { col: picture.col, row: picture.row },
      br: { col: picture.col + 1, row: picture.row + 1 },
      editAs: "twoCell",
    } as unknown as Parameters<typeof sheet.addImage>[1]);
  }
  const restored = new ExcelJS.Workbook();
  await restored.xlsx.load(await workbook.xlsx.writeBuffer());
  return { workbook: restored, sheet: restored.getWorksheet("收支")! };
}

describe("readWorksheetPhotos", () => {
  it("按锚点列名读取内嵌 JPEG 原图", async () => {
    const { workbook, sheet } = await sheetWithPictures([{ col: 2, row: 1 }]);
    const result = readWorksheetPhotos(
      workbook,
      sheet,
      ["日期", "金额", "照片1", "照片2", "照片3", "照片4", "照片5"],
      1,
    );
    expect(result.issues).toEqual([]);
    expect(result.images).toMatchObject([
      { rowNumber: 2, columnName: "照片1", mimeType: "image/jpeg" },
    ]);
  });

  it("按照片列序返回每行原图，即使工作簿内图片记录顺序相反", async () => {
    const { workbook, sheet } = await sheetWithPictures([
      { col: 3, row: 1 },
      { col: 2, row: 1 },
    ]);
    const result = readWorksheetPhotos(
      workbook,
      sheet,
      ["日期", "金额", "照片1", "照片2", "照片3", "照片4", "照片5"],
      1,
    );
    expect(result.photosByRow.get(2)?.map((photo) => photo.columnName)).toEqual(
      ["照片1", "照片2"],
    );
  });

  it("照片列名与其它导入列一样允许首尾空格", async () => {
    const { workbook, sheet } = await sheetWithPictures([{ col: 2, row: 1 }]);
    const result = readWorksheetPhotos(
      workbook,
      sheet,
      ["日期", "金额", " 照片1 ", "照片2", "照片3", "照片4", "照片5"],
      1,
    );
    expect(result.issues).toEqual([]);
    expect(result.photosByRow.get(2)?.[0]?.columnName).toBe("照片1");
  });

  it("同一记录的两个同名照片列都嵌入图片时应报错", async () => {
    const { workbook, sheet } = await sheetWithPictures([
      { col: 2, row: 1 },
      { col: 3, row: 1 },
    ]);
    const result = readWorksheetPhotos(
      workbook,
      sheet,
      ["日期", "金额", "照片1", "照片1", "照片3", "照片4", "照片5"],
      1,
    );
    expect(result.issues).toEqual([
      expect.objectContaining({
        column: "照片1",
        kind: "row",
        rowNumber: 2,
      }),
    ]);
  });

  it("错列、同格重复、非法字节都按行报错", async () => {
    const { workbook, sheet } = await sheetWithPictures([
      { col: 1, row: 1 },
      { col: 2, row: 1 },
      { col: 2, row: 1 },
      { col: 3, row: 1, data: "AAEC" },
    ]);
    const result = readWorksheetPhotos(
      workbook,
      sheet,
      ["日期", "金额", "照片1", "照片2", "照片3", "照片4", "照片5"],
      1,
    );
    expect(result.issues).toHaveLength(3);
    expect(result.issues.every((issue) => issue.rowNumber === 2)).toBe(true);
  });
});
