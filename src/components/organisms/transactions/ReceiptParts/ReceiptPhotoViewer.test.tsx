import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { transactionAttachmentMessages as m } from "config/transactionAttachmentMessages";
import { ReceiptPhotoViewer } from "./ReceiptPhotoViewer";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("ReceiptPhotoViewer", () => {
  it("关闭后重新打开清除上次保存失败提示及缩放状态", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("network failure"));
    const photos = [{ id: "receipt-1", fullUrl: "/receipt.jpg" }];
    const onClose = vi.fn();
    const { rerender } = render(
      <ReceiptPhotoViewer photos={photos} open onClose={onClose} />,
    );

    fireEvent.doubleClick(screen.getByRole("img", { name: m.photoPreview }));
    expect(screen.getByRole("img", { name: m.photoPreview })).toHaveStyle({
      transform: "scale(2)",
    });
    fireEvent.click(screen.getByRole("button", { name: m.photoSaveAlbum }));
    expect(await screen.findByText(m.loadFailed)).toBeInTheDocument();

    rerender(<ReceiptPhotoViewer photos={photos} open={false} onClose={onClose} />);
    rerender(<ReceiptPhotoViewer photos={photos} open onClose={onClose} />);

    await waitFor(() => {
      expect(screen.queryByText(m.loadFailed)).not.toBeInTheDocument();
      expect(screen.getByRole("img", { name: m.photoPreview })).toHaveStyle({
        transform: "scale(1)",
      });
    });
  });
});
