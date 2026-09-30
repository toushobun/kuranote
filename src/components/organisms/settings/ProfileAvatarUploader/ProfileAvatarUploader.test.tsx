import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { AvatarAction, AvatarActionState } from "types/user";

import {
  getDisplayNameInitial,
  ProfileAvatarUploader,
} from "./ProfileAvatarUploader";

const mocks = vi.hoisted(() => ({ compressAvatarImage: vi.fn() }));

vi.mock("utils/avatarImage", () => ({
  compressAvatarImage: mocks.compressAvatarImage,
}));

const compressedAvatar = new Blob(["webp"], { type: "image/webp" });

beforeEach(() => {
  mocks.compressAvatarImage.mockResolvedValue(compressedAvatar);
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function renderUploader({
  action = vi.fn<AvatarAction>(async () => ({
    success: "头像已更换。",
    successKey: "success-1",
  })),
  avatarUrl = null,
}: { action?: AvatarAction; avatarUrl?: string | null } = {}) {
  render(
    <ProfileAvatarUploader
      action={action}
      avatarUrl={avatarUrl}
      displayName="淞文"
    />,
  );
  return { action };
}

function selectFile(file = new File(["png"], "a.png", { type: "image/png" })) {
  fireEvent.change(screen.getByTestId("profile-avatar-input"), {
    target: { files: [file] },
  });
  return file;
}

describe("ProfileAvatarUploader", () => {
  it("没有头像时显示昵称首字", () => {
    renderUploader();

    expect(screen.getByText("淞")).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("有头像时显示头像图片", () => {
    renderUploader({ avatarUrl: "https://example.com/avatar.webp" });

    expect(screen.getByRole("img", { name: "淞文" })).toHaveAttribute(
      "src",
      "https://example.com/avatar.webp",
    );
  });

  it("点击头像打开图片选择", () => {
    renderUploader();
    const input = screen.getByTestId("profile-avatar-input");
    const click = vi.spyOn(input, "click");

    fireEvent.click(screen.getByRole("button", { name: "更换头像" }));

    expect(click).toHaveBeenCalledOnce();
    expect(input).toHaveAttribute("accept", "image/*");
  });

  it("选择图片后提交压缩后的文件并显示成功提示", async () => {
    const { action } = renderUploader();

    const file = selectFile();

    await waitFor(() => expect(action).toHaveBeenCalledOnce());
    expect(mocks.compressAvatarImage).toHaveBeenCalledWith(file);
    const formData = vi.mocked(action).mock.calls[0]?.[1] as FormData;
    const submitted = formData.get("avatar");
    expect(submitted).toBeInstanceOf(Blob);
    expect((submitted as Blob).type).toBe("image/webp");
    expect(await screen.findByText("头像已更换")).toBeInTheDocument();
  });

  it("上传中显示进度并禁止重复点击", async () => {
    let resolveAction: (state: AvatarActionState) => void = () => {};
    const action = vi.fn<AvatarAction>(
      () =>
        new Promise((resolve) => {
          resolveAction = resolve;
        }),
    );
    renderUploader({ action });

    selectFile();

    const button = await screen.findByRole("button", { name: "头像上传中" });
    expect(button).toBeDisabled();
    expect(screen.getByRole("progressbar")).toBeInTheDocument();

    resolveAction({ success: "头像已更换。", successKey: "success-1" });
    expect(
      await screen.findByRole("button", { name: "更换头像" }),
    ).toBeEnabled();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });

  it("上传失败时显示 Action 返回的错误文案", async () => {
    renderUploader({
      action: vi.fn<AvatarAction>(async () => ({
        error: "头像上传失败，请稍后重试。",
        errorKey: "error-1",
      })),
    });

    selectFile();

    expect(await screen.findByText("头像更换失败")).toBeInTheDocument();
    expect(screen.getByText("头像上传失败，请稍后重试。")).toBeInTheDocument();
  });

  it("图片无法读取时提示换一张图片且不提交", async () => {
    mocks.compressAvatarImage.mockRejectedValue(new Error("decode failed"));
    const { action } = renderUploader();

    selectFile();

    expect(
      await screen.findByText("无法读取该图片，请换一张图片后重试。"),
    ).toBeInTheDocument();
    expect(action).not.toHaveBeenCalled();
  });
});

describe("getDisplayNameInitial", () => {
  it("取去除空白后的首个字符", () => {
    expect(getDisplayNameInitial("  淞文")).toBe("淞");
    expect(getDisplayNameInitial("😀Kura")).toBe("😀");
    expect(getDisplayNameInitial("kura")).toBe("K");
    expect(getDisplayNameInitial("")).toBe("");
  });
});
