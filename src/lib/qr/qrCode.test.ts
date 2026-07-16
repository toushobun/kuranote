import { describe, expect, it } from "vitest";

import { createQrMatrix, qrMatrixToPath } from "./qrCode";

const inviteLink =
  "https://kuranote.example/invite/0123456789abcdef0123456789abcdef";

describe("qrCode", () => {
  it("生成方形二维码矩阵并保留三个定位图案", () => {
    const matrix = createQrMatrix(inviteLink);

    expect(matrix.length).toBeGreaterThanOrEqual(21);
    expect(matrix.length % 4).toBe(1);
    expect(matrix.every((row) => row.length === matrix.length)).toBe(true);

    expect(matrix[0].slice(0, 7)).toEqual([
      true,
      true,
      true,
      true,
      true,
      true,
      true,
    ]);
    expect(matrix[6].slice(0, 7)).toEqual([
      true,
      true,
      true,
      true,
      true,
      true,
      true,
    ]);
    expect(matrix[0].slice(-7)).toEqual([
      true,
      true,
      true,
      true,
      true,
      true,
      true,
    ]);
    expect(matrix.at(-1)?.slice(0, 7)).toEqual([
      true,
      true,
      true,
      true,
      true,
      true,
      true,
    ]);
  });

  it("不同邀请链接生成不同路径", () => {
    const firstPath = qrMatrixToPath(createQrMatrix(inviteLink));
    const secondPath = qrMatrixToPath(
      createQrMatrix(`${inviteLink}-replacement`),
    );

    expect(firstPath).not.toBe(secondPath);
    expect(firstPath).toContain("M4 4h7v1H4z");
  });

  it("内容超过二维码容量时拒绝生成", () => {
    expect(() => createQrMatrix("x".repeat(3000))).toThrow("二维码内容过长");
  });
});
