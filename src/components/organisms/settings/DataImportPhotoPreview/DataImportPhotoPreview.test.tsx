import { act, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DataImportPhotoPreview } from "./DataImportPhotoPreview";

const createObjectURL = vi.fn(() => "blob:receipt");
const revokeObjectURL = vi.fn();

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("DataImportPhotoPreview", () => {
  it("按 Excel 行号展示图片并在卸载时释放 Object URL", async () => {
    vi.stubGlobal(
      "URL",
      Object.assign(URL, { createObjectURL, revokeObjectURL }),
    );
    const photo = {
      bytes: new Uint8Array([0xff, 0xd8, 0xff, 0xd9]),
      columnName: "照片1",
      mimeType: "image/jpeg" as const,
      rowNumber: 2,
    };
    const { unmount } = render(
      <DataImportPhotoPreview rows={[{ rowNumber: 2, photos: [photo] }]} />,
    );
    expect(screen.getByText("第 2 行")).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByRole("img", { name: "照片1" })).toHaveAttribute(
        "src",
        "blob:receipt",
      ),
    );
    expect(createObjectURL).toHaveBeenCalledTimes(1);
    act(() => unmount());
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:receipt");
  });
});
