import { fireEvent, screen, within } from "@testing-library/react";

/** 分组区域（section，名称为分组名）。 */
export function getChecklistGroup(groupName: string) {
  return screen.getByRole("region", { name: groupName });
}

/** 分组行右侧的展开按钮（名称为分组名，带 aria-expanded）。 */
export function getChecklistGroupExpandButton(groupName: string) {
  return within(getChecklistGroup(groupName)).getByRole("button", {
    name: groupName,
  });
}

/** 点击展开按钮切换分组的展开状态，返回该分组区域。 */
export function toggleChecklistGroup(groupName: string) {
  fireEvent.click(getChecklistGroupExpandButton(groupName));
  return getChecklistGroup(groupName);
}

/** 分组中名称为 itemName 的项目复选框（需先展开分组）。无障碍名称包含副文字，按前缀匹配。 */
export function getChecklistItemCheckbox(groupName: string, itemName: string) {
  return within(getChecklistGroup(groupName)).getByRole("checkbox", {
    name: new RegExp(`^${itemName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`),
  });
}
