import { fireEvent, screen, within } from "@testing-library/react";

/** 添加账户底部弹层（以「添加{类型名}」为名称的对话框）。 */
export function getAccountAddSheet(typeLabel: string) {
  return screen.getByRole("dialog", { name: `添加${typeLabel}` });
}

export function getAccountNameInput(sheet: HTMLElement) {
  return within(sheet).getByRole("textbox", { name: "账户名称" });
}

export function changeAccountName(sheet: HTMLElement, name: string) {
  fireEvent.change(getAccountNameInput(sheet), { target: { value: name } });
}

export function clickAccountCandidate(
  sheet: HTMLElement,
  name: string | RegExp,
) {
  fireEvent.click(within(sheet).getByRole("button", { name }));
}

export function submitAccountAddSheet(sheet: HTMLElement) {
  fireEvent.click(within(sheet).getByRole("button", { name: "添加" }));
}
