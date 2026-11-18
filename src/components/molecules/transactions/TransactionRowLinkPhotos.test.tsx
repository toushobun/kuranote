import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createTransactionListItem } from "@/test/mocks/transactions";
import { TransactionRowLink } from "./TransactionRowLink";

const mocks = vi.hoisted(() => ({
  loadReceiptPhotos: vi.fn(),
}));
vi.mock("internal/transaction/adapter/next/attachmentActions", () => ({
  loadReceiptPhotos: mocks.loadReceiptPhotos,
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("TransactionRowLink 小票照片", () => {
  it("没有照片时整行依旧是普通链接", () => {
    render(
      <TransactionRowLink
        href="/transactions/record-1/edit"
        item={createTransactionListItem({ id: "record-1", attachmentCount: 0 })}
      />,
    );
    expect(
      screen.queryByRole("button", { name: "查看照片" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveAttribute(
      "href",
      "/transactions/record-1/edit",
    );
  });

  it("点击照片图标只打开预览，不进入记录；加载 URL 延迟到点击后", async () => {
    mocks.loadReceiptPhotos.mockResolvedValue([
      {
        id: "photo-1",
        fullUrl: "/receipt-1.jpg",
        thumbnailUrl: "/thumb-1.jpg",
      },
    ]);
    render(
      <TransactionRowLink
        href="/transactions/record-1/edit"
        item={createTransactionListItem({
          id: "record-1",
          attachmentCount: 1,
          merchant_name: "便利店",
        })}
      />,
    );
    const link = screen.getByRole("link", { name: "进入记录" });
    const photoButton = screen.getByRole("button", { name: "查看照片" });
    expect(link).toHaveAttribute("href", "/transactions/record-1/edit");
    expect(link.contains(photoButton)).toBe(false);
    expect(mocks.loadReceiptPhotos).not.toHaveBeenCalled();

    fireEvent.click(photoButton);
    expect(mocks.loadReceiptPhotos).toHaveBeenCalledWith("record-1");
    await waitFor(() =>
      expect(screen.getByRole("img", { name: "查看照片" })).toHaveAttribute(
        "src",
        "/receipt-1.jpg",
      ),
    );
    fireEvent.click(screen.getByRole("button", { name: "关闭照片预览" }));
    await waitFor(() =>
      expect(
        screen.queryByRole("img", { name: "查看照片" }),
      ).not.toBeInTheDocument(),
    );
  });

  it("关闭后重新打开时忽略上次尚未完成的读取", async () => {
    const resolves: Array<
      (photos: { id: string; fullUrl: string; thumbnailUrl: string }[]) => void
    > = [];
    mocks.loadReceiptPhotos.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolves.push(resolve);
        }),
    );
    render(
      <TransactionRowLink
        href="/transactions/record-1/edit"
        item={createTransactionListItem({ id: "record-1", attachmentCount: 1 })}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "查看照片" }));
    fireEvent.click(screen.getByRole("button", { name: "关闭照片预览" }));
    fireEvent.click(screen.getByRole("button", { name: "查看照片" }));
    await act(async () => {
      resolves[0]?.([
        {
          id: "old",
          fullUrl: "/old.jpg",
          thumbnailUrl: "/old-thumb.jpg",
        },
      ]);
    });
    expect(screen.getByText("照片读取中…")).toBeInTheDocument();
    expect(
      screen.queryByRole("img", { name: "查看照片" }),
    ).not.toBeInTheDocument();

    await act(async () => {
      resolves[1]?.([
        {
          id: "new",
          fullUrl: "/new.jpg",
          thumbnailUrl: "/new-thumb.jpg",
        },
      ]);
    });
    expect(screen.getByRole("img", { name: "查看照片" })).toHaveAttribute(
      "src",
      "/new.jpg",
    );
  });

  it("加载签名 URL 时显示读取中", () => {
    mocks.loadReceiptPhotos.mockReturnValue(new Promise(() => {}));
    render(
      <TransactionRowLink
        href="/transactions/record-1/edit"
        item={createTransactionListItem({ id: "record-1", attachmentCount: 1 })}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "查看照片" }));
    expect(screen.getByText("照片读取中…")).toBeInTheDocument();
  });
});
