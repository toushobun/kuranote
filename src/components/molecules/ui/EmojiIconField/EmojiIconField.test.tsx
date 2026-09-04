import { fireEvent, render, screen } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";
import { describe, expect, it, vi } from "vitest";

import { createDynamicMuiTheme } from "providers/DynamicMuiThemeProvider";
import { designTokens } from "theme/theme";
import { userThemeKeys, userThemeTokens } from "theme/userThemeTokens";

import { EmojiIconField } from "./EmojiIconField";

function toComputedColor(color: string) {
  if (color === "#fff") {
    return "rgb(255, 255, 255)";
  }

  return color;
}

describe("EmojiIconField", () => {
  it("按分组和关键词筛选并确认图标", () => {
    const onChange = vi.fn();
    render(
      <EmojiIconField
        fieldLabel="标签图标"
        groups={[{ id: "shop", label: "零售" }]}
        helperText="选择图标"
        inputName="icon"
        onChange={onChange}
        options={[
          { emoji: "🛒", groupId: "shop", keywords: ["采购"], label: "超市" },
          { emoji: "✈️", groupId: "travel", keywords: ["出行"], label: "旅行" },
        ]}
        searchPlaceholder="搜索"
        value="🛒"
      />,
    );

    expect(screen.getByLabelText("当前标签图标：🛒")).toHaveStyle({
      borderRadius: `${designTokens.radius.sm}px`,
    });

    fireEvent.click(screen.getByRole("button", { name: "选择图标" }));
    fireEvent.change(screen.getByLabelText("搜索图标"), {
      target: { value: "出行" },
    });
    const travelOption = screen.getByRole("button", { name: "选择旅行图标" });
    expect(travelOption).toHaveStyle({
      borderRadius: `${designTokens.radius.item}px`,
    });
    fireEvent.click(travelOption);
    fireEvent.click(screen.getByRole("button", { name: "确定" }));
    expect(onChange).toHaveBeenCalledWith("✈️");
  });

  it("全部用户主题下选中态勾选图标使用可读的对比色", () => {
    userThemeKeys.forEach((themeKey) => {
      const dynamicTheme = createDynamicMuiTheme(themeKey);
      const { unmount } = render(
        <ThemeProvider theme={dynamicTheme}>
          <EmojiIconField
            fieldLabel="标签图标"
            groups={[{ id: "shop", label: "零售" }]}
            helperText="选择图标"
            inputName="icon"
            onChange={() => {}}
            options={[
              {
                emoji: "🛒",
                groupId: "shop",
                keywords: ["采购"],
                label: "超市",
              },
            ]}
            searchPlaceholder="搜索"
            value="🛒"
          />
        </ThemeProvider>,
      );

      fireEvent.click(screen.getByRole("button", { name: "选择图标" }));
      const checkIcon = screen.getByTestId("CheckRoundedIcon");

      expect(dynamicTheme.palette.primary.main).toBe(
        userThemeTokens[themeKey].palette.accent,
      );
      expect(getComputedStyle(checkIcon).color).toBe(
        toComputedColor(dynamicTheme.palette.primary.contrastText),
      );

      unmount();
    });
  });
});
