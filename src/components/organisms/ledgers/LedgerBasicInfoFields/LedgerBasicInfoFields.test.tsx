import { fireEvent, render, screen, within } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";

import { UserThemeProvider } from "theme/UserThemeProvider";

import {
  LedgerBasicInfoFields,
  type LedgerBasicInfoValues,
} from "./LedgerBasicInfoFields";

const defaults: LedgerBasicInfoValues = {
  baseCurrency: "JPY",
  displayColor: "amber",
  displayName: "淞文",
  ledgerName: "家庭账本",
};

function ControlledFields() {
  const [values, setValues] = useState(defaults);

  return (
    <form aria-label="基本信息" onSubmit={(event) => event.preventDefault()}>
      <LedgerBasicInfoFields onChange={setValues} values={values} />
    </form>
  );
}

function renderFields() {
  return render(
    <UserThemeProvider>
      <ControlledFields />
    </UserThemeProvider>,
  );
}

function getFormValues() {
  return Object.fromEntries(
    new FormData(
      screen.getByRole<HTMLFormElement>("form", { name: "基本信息" }),
    ).entries(),
  );
}

describe("LedgerBasicInfoFields", () => {
  it("显示四个字段与传入的值", () => {
    renderFields();

    expect(screen.getByLabelText("账本名称")).toHaveValue("家庭账本");
    expect(
      screen.getByRole("combobox", { name: "默认货币" }),
    ).toHaveTextContent("JPY 日元");
    expect(screen.getByLabelText("我的显示名")).toHaveValue("淞文");
    expect(
      within(
        screen.getByRole("radiogroup", { name: "我的个性色" }),
      ).getAllByRole("radio"),
    ).toHaveLength(6);
    expect(screen.getByLabelText("琥珀橙")).toBeChecked();
  });

  it("表单提交的字段名与账本创建表单解析一致，个性色选项不参与提交", () => {
    renderFields();

    expect(getFormValues()).toEqual({
      baseCurrency: "JPY",
      ledgerName: "家庭账本",
      memberDisplayColor: "amber",
      memberDisplayName: "淞文",
    });
  });

  it("修改各字段后通知新的值", () => {
    renderFields();

    fireEvent.change(screen.getByLabelText("账本名称"), {
      target: { value: "旅行账本" },
    });
    fireEvent.mouseDown(screen.getByRole("combobox", { name: "默认货币" }));
    fireEvent.click(screen.getByRole("option", { name: "USD 美元" }));
    fireEvent.change(screen.getByLabelText("我的显示名"), {
      target: { value: "旅人" },
    });
    fireEvent.click(screen.getByLabelText("天空蓝"));

    expect(getFormValues()).toEqual({
      baseCurrency: "USD",
      ledgerName: "旅行账本",
      memberDisplayColor: "sky",
      memberDisplayName: "旅人",
    });
  });

  it("清空账本名称后聚焦输入框", () => {
    renderFields();

    fireEvent.click(screen.getByRole("button", { name: "清空账本名称" }));

    expect(screen.getByLabelText("账本名称")).toHaveValue("");
    expect(screen.getByLabelText("账本名称")).toHaveFocus();
  });
});
