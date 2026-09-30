import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { UserThemeProvider } from "theme/UserThemeProvider";
import {
  companyLedgerId,
  familyLedgerId,
  profileLedgerDisplayNames,
  tripLedgerId,
} from "test/userProfileFixtures";
import type { DisplayNameActionState } from "types/user";

import { ProfileNicknameDialog } from "./ProfileNicknameDialog";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const successState: DisplayNameActionState = {
  success: "昵称已保存。",
  successKey: "success-1",
};

function renderDialog(
  props: Partial<Parameters<typeof ProfileNicknameDialog>[0]> = {},
) {
  const action = vi.fn(async () => successState);
  const onClose = vi.fn();
  const view = render(
    <UserThemeProvider storageScope="profile-nickname-dialog-test">
      <ProfileNicknameDialog
        action={action}
        currentDisplayName="淞文"
        currentLedgerId={familyLedgerId}
        ledgers={profileLedgerDisplayNames}
        onClose={onClose}
        open
        {...props}
      />
    </UserThemeProvider>,
  );
  return { action, onClose, view };
}

function changeNickname(value: string) {
  fireEvent.change(screen.getByRole("textbox", { name: "昵称" }), {
    target: { value },
  });
}

function saveNickname(value: string) {
  changeNickname(value);
  fireEvent.click(screen.getByRole("button", { name: "保存" }));
}

function submittedFormData(action: ReturnType<typeof vi.fn>) {
  const calls = action.mock.calls;
  return calls[calls.length - 1]?.[1] as FormData;
}

describe("ProfileNicknameDialog", () => {
  it("以当前昵称作为初始值，空白昵称不能保存", () => {
    renderDialog();

    expect(screen.getByRole("textbox", { name: "昵称" })).toHaveValue("淞文");
    changeNickname("   ");
    expect(screen.getByRole("button", { name: "保存" })).toBeDisabled();
  });

  it("没有账本时直接保存，不弹出同步确认", async () => {
    const { action, onClose } = renderDialog({ ledgers: [] });

    saveNickname(" 新昵称 ");

    await waitFor(() => expect(action).toHaveBeenCalledOnce());
    const formData = submittedFormData(action);
    expect(formData.get("displayName")).toBe("新昵称");
    expect(formData.getAll("syncLedgerIds")).toEqual([]);
    expect(
      screen.queryByText("是否同步修改以下账本中的昵称？"),
    ).not.toBeInTheDocument();
    await waitFor(() => expect(onClose).toHaveBeenCalledOnce());
    expect(await screen.findByText("昵称已保存")).toBeInTheDocument();
  });

  it("有账本时弹出同步确认，默认只勾选当前账本", async () => {
    const { action } = renderDialog();

    saveNickname("新昵称");

    expect(
      await screen.findByRole("dialog", {
        name: "是否同步修改以下账本中的昵称？",
      }),
    ).toBeInTheDocument();
    expect(action).not.toHaveBeenCalled();
    expect(screen.getByRole("checkbox", { name: /家庭账本/ })).toBeChecked();
    expect(
      screen.getByRole("checkbox", { name: /公司报销/ }),
    ).not.toBeChecked();
    expect(
      screen.getByRole("checkbox", { name: /北海道旅行/ }),
    ).not.toBeChecked();
  });

  it("确定时提交勾选的账本", async () => {
    const { action } = renderDialog();

    saveNickname("新昵称");
    fireEvent.click(await screen.findByText("北海道旅行"));
    fireEvent.click(screen.getByRole("button", { name: "确定" }));

    await waitFor(() => expect(action).toHaveBeenCalledOnce());
    expect(submittedFormData(action).getAll("syncLedgerIds")).toEqual([
      familyLedgerId,
      tripLedgerId,
    ]);
  });

  it("全选、全不选改变勾选状态", async () => {
    const { action } = renderDialog();

    saveNickname("新昵称");
    fireEvent.click(await screen.findByRole("button", { name: "全选" }));
    for (const name of [/家庭账本/, /公司报销/, /北海道旅行/]) {
      expect(screen.getByRole("checkbox", { name })).toBeChecked();
    }
    fireEvent.click(screen.getByRole("button", { name: "全选" }));
    fireEvent.click(screen.getByRole("button", { name: "确定" }));

    await waitFor(() => expect(action).toHaveBeenCalledOnce());
    expect(submittedFormData(action).getAll("syncLedgerIds")).toEqual([
      familyLedgerId,
      companyLedgerId,
      tripLedgerId,
    ]);
  });

  it("全不选后取消所有勾选", async () => {
    renderDialog();

    saveNickname("新昵称");
    fireEvent.click(await screen.findByRole("button", { name: "全不选" }));

    for (const name of [/家庭账本/, /公司报销/, /北海道旅行/]) {
      expect(screen.getByRole("checkbox", { name })).not.toBeChecked();
    }
  });

  it("仅修改个人昵称时不提交账本", async () => {
    const { action } = renderDialog();

    saveNickname("新昵称");
    fireEvent.click(
      await screen.findByRole("button", { name: "仅修改个人昵称" }),
    );

    await waitFor(() => expect(action).toHaveBeenCalledOnce());
    expect(submittedFormData(action).getAll("syncLedgerIds")).toEqual([]);
  });

  it("保存失败时显示错误并停留在同步确认", async () => {
    const action = vi.fn(async () => ({
      error: "以下账本无法使用该昵称，昵称未修改。",
      errorKey: "error-1",
    }));
    const { onClose } = renderDialog({ action });

    saveNickname("新昵称");
    fireEvent.click(await screen.findByRole("button", { name: "确定" }));

    expect(
      await screen.findByText("以下账本无法使用该昵称，昵称未修改。"),
    ).toBeInTheDocument();
    expect(screen.getByText("昵称保存失败")).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole("checkbox", { name: /家庭账本/ })).toBeChecked();
  });

  it("重新打开时恢复为当前昵称", () => {
    const { view } = renderDialog();
    changeNickname("未保存的输入");

    const rerenderDialog = (open: boolean) =>
      view.rerender(
        <UserThemeProvider storageScope="profile-nickname-dialog-test">
          <ProfileNicknameDialog
            action={vi.fn()}
            currentDisplayName="淞文"
            currentLedgerId={familyLedgerId}
            ledgers={profileLedgerDisplayNames}
            onClose={vi.fn()}
            open={open}
          />
        </UserThemeProvider>,
      );
    rerenderDialog(false);
    rerenderDialog(true);

    expect(screen.getByRole("textbox", { name: "昵称" })).toHaveValue("淞文");
  });
});
