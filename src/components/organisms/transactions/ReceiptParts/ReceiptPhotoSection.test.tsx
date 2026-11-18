import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ReceiptPhotoSection } from "./ReceiptPhotoSection";
import type {
  ReceiptPhotoController,
  ReceiptPhotoEntry,
} from "./useReceiptPhotos";

function photo(
  index: number,
  status: ReceiptPhotoEntry["status"] = "uploaded",
): ReceiptPhotoEntry {
  return {
    key: String(index),
    attachmentId: status === "uploaded" ? `photo-${index}` : undefined,
    fullUrl: "/receipt.jpg",
    previewUrl: "/receipt-thumb.jpg",
    status,
    source: "draft",
  };
}

function controller(
  entries: ReceiptPhotoEntry[] = [],
  error: string | null = null,
): ReceiptPhotoController {
  return {
    photos: entries,
    error,
    loading: false,
    touched: false,
    savingPhotos: false,
    addFiles: vi.fn(),
    remove: vi.fn(),
    retry: vi.fn(),
    prepareForSave: vi.fn().mockResolvedValue(true),
  };
}

afterEach(cleanup);

describe("ReceiptPhotoSection", () => {
  it("空状态有添加按钮、最多五张提示与 multiple 文件输入", () => {
    render(<ReceiptPhotoSection controller={controller()} />);
    expect(
      screen.getByRole("button", { name: "添加照片" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/最多 5 张/)).toBeInTheDocument();
    const input = screen.getByLabelText("添加照片", { selector: "input" });
    expect(input).toHaveAttribute("accept", "image/*");
    expect(input).toHaveAttribute("multiple");
    expect(input).not.toHaveAttribute("capture");
  });

  it("显示已上传的缩略图和可移除按钮", () => {
    const c = controller([photo(1), photo(2)]);
    render(<ReceiptPhotoSection controller={c} />);
    expect(screen.getByText("2 / 5")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "移除照片 1" }));
    expect(c.remove).toHaveBeenCalledWith("1");
  });

  it("上传中有遮罩且不能点缩略图", () => {
    render(
      <ReceiptPhotoSection controller={controller([photo(1, "uploading")])} />,
    );
    expect(screen.getByRole("button", { name: "查看照片 1" })).toBeDisabled();
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("失败态点击重试交由 hook 处理", () => {
    const c = controller([photo(1, "failed")], "上传失败");
    render(<ReceiptPhotoSection controller={c} />);
    fireEvent.click(screen.getByRole("button", { name: "重试 1" }));
    expect(c.retry).toHaveBeenCalledWith("1");
    expect(screen.getByRole("alert")).toHaveTextContent("上传失败");
  });

  it("加载已有照片期间禁用添加按钮及文件输入", () => {
    const c = { ...controller(), loading: true };
    render(<ReceiptPhotoSection controller={c} />);
    expect(screen.getByRole("button", { name: "添加照片" })).toBeDisabled();
    expect(
      screen.getByLabelText("添加照片", { selector: "input" }),
    ).toBeDisabled();
  });

  it("满五张不再出现添加格", () => {
    render(
      <ReceiptPhotoSection
        controller={controller(Array.from({ length: 5 }, (_, i) => photo(i)))}
      />,
    );
    expect(screen.getByText("5 / 5")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "添加" }),
    ).not.toBeInTheDocument();
  });

  it("只读详情仅显示缩略图，没有照片时整个区域不显示", () => {
    const { rerender } = render(
      <ReceiptPhotoSection readOnly controller={controller([photo(1)])} />,
    );
    expect(
      screen.getByRole("button", { name: "查看照片 1" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "移除照片 1" }),
    ).not.toBeInTheDocument();
    rerender(<ReceiptPhotoSection readOnly controller={controller()} />);
    expect(screen.queryByText("照片")).not.toBeInTheDocument();
  });
});
