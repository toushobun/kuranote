import { describe, expect, it } from "vitest";

import {
  applyAmountKeypadKey,
  confirmAmountKeypadState,
  createAmountKeypadState,
  getAmountDecimalPlaces,
  getAmountKeypadExpressionText,
  getAmountKeypadPreviewValue,
  isDecimalAmountDisabled,
  isValidMoneyText,
  isValidPositiveMoneyText,
  normalizeMoneyText,
} from "./transactionAmountInput";

describe("transactionAmountInput", () => {
  it("根据币种判断是否禁用小数输入", () => {
    expect(isDecimalAmountDisabled("JPY")).toBe(true);
    expect(isDecimalAmountDisabled("jpy")).toBe(true);
    expect(isDecimalAmountDisabled("USD")).toBe(false);
    expect(isDecimalAmountDisabled()).toBe(true);
    expect(isDecimalAmountDisabled("")).toBe(true);
  });

  it("已知非日元币种时校验最多两位小数的金额格式", () => {
    expect(getAmountDecimalPlaces("USD")).toBe(2);
    expect(isValidMoneyText("1200", { currency: "USD" })).toBe(true);
    expect(isValidMoneyText("1200.5", { currency: "USD" })).toBe(true);
    expect(isValidMoneyText("1200.50", { currency: "USD" })).toBe(true);
    expect(isValidMoneyText("1200.500", { currency: "USD" })).toBe(false);
    expect(isValidMoneyText("12..5", { currency: "USD" })).toBe(false);
  });

  it("限制整数位数，避免无限长金额", () => {
    expect(isValidMoneyText("123456789012")).toBe(true);
    expect(isValidMoneyText("1234567890123")).toBe(false);

    let state = createAmountKeypadState("123456789012");
    state = applyAmountKeypadKey(state, "3");

    expect(state.displayValue).toBe("123456789012");
  });

  it("正数金额不允许空值和 0", () => {
    expect(isValidPositiveMoneyText("")).toBe(false);
    expect(isValidPositiveMoneyText("0")).toBe(false);
    expect(isValidPositiveMoneyText("0.01", { currency: "USD" })).toBe(true);
  });

  it("JPY 使用整数金额，不允许多余小数", () => {
    expect(getAmountDecimalPlaces("JPY")).toBe(0);
    expect(isValidMoneyText("1200", { currency: "JPY" })).toBe(true);
    expect(isValidMoneyText("1200.1", { currency: "JPY" })).toBe(false);
    expect(normalizeMoneyText("001200", { currency: "JPY" })).toBe("1200");
  });

  it("未选择账户、币种未知时按整数金额处理，不允许小数", () => {
    expect(getAmountDecimalPlaces()).toBe(0);
    expect(getAmountDecimalPlaces("")).toBe(0);
    expect(isValidMoneyText("1200")).toBe(true);
    expect(isValidMoneyText("1200.1")).toBe(false);
    expect(isValidPositiveMoneyText("0.01")).toBe(false);
    expect(normalizeMoneyText("001200")).toBe("1200");
    expect(normalizeMoneyText("001.20")).toBeNull();
  });

  it("规范化金额时去掉前导零和多余小数 0", () => {
    expect(normalizeMoneyText("001.20", { currency: "USD" })).toBe("1.2");
    expect(normalizeMoneyText("001.00", { currency: "USD" })).toBe("1");
  });

  it("按键输入支持数字、小数点、删除和清空", () => {
    const options = { currency: "USD" };
    let state = createAmountKeypadState();
    state = applyAmountKeypadKey(state, "1", options);
    state = applyAmountKeypadKey(state, ".", options);
    state = applyAmountKeypadKey(state, "2", options);
    state = applyAmountKeypadKey(state, "3", options);
    state = applyAmountKeypadKey(state, "4", options);

    expect(state.displayValue).toBe("1.23");

    state = applyAmountKeypadKey(state, "backspace", options);
    expect(state.displayValue).toBe("1.2");

    state = applyAmountKeypadKey(state, "clear", options);
    expect(state.displayValue).toBe("");
  });

  it("未选择账户、币种未知时小数点按键不可用", () => {
    let state = createAmountKeypadState();
    state = applyAmountKeypadKey(state, "1");
    state = applyAmountKeypadKey(state, ".");
    state = applyAmountKeypadKey(state, "5");

    expect(state.displayValue).toBe("15");
  });

  it("JPY 金额输入会忽略小数点", () => {
    let state = createAmountKeypadState();
    state = applyAmountKeypadKey(state, "1", { currency: "JPY" });
    state = applyAmountKeypadKey(state, ".", { currency: "JPY" });
    state = applyAmountKeypadKey(state, "5", { currency: "JPY" });

    expect(state.displayValue).toBe("15");
  });

  it("支持简单加减后确认", () => {
    const options = { currency: "USD" };
    let state = createAmountKeypadState();
    state = applyAmountKeypadKey(state, "1", options);
    state = applyAmountKeypadKey(state, "0", options);
    state = applyAmountKeypadKey(state, "+", options);
    state = applyAmountKeypadKey(state, "2", options);
    state = applyAmountKeypadKey(state, ".", options);
    state = applyAmountKeypadKey(state, "5", options);

    const result = confirmAmountKeypadState(state, options);

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBe("12.5");
  });

  it("输入运算符后实时预览计算结果和表达式", () => {
    let state = createAmountKeypadState();
    state = applyAmountKeypadKey(state, "1");
    state = applyAmountKeypadKey(state, "0");
    state = applyAmountKeypadKey(state, "0");
    expect(getAmountKeypadExpressionText(state)).toBe("");

    state = applyAmountKeypadKey(state, "+");
    state = applyAmountKeypadKey(state, "2");

    expect(getAmountKeypadPreviewValue(state)).toBe("102");
    expect(getAmountKeypadExpressionText(state)).toBe("100 + 2");

    state = applyAmountKeypadKey(state, "0");
    expect(getAmountKeypadPreviewValue(state)).toBe("120");
    expect(getAmountKeypadExpressionText(state)).toBe("100 + 20");

    state = applyAmountKeypadKey(state, "0");
    expect(getAmountKeypadPreviewValue(state)).toBe("300");
    expect(getAmountKeypadExpressionText(state)).toBe("100 + 200");
  });

  it("连续输入运算符时保留完整表达式", () => {
    let state = createAmountKeypadState();
    state = applyAmountKeypadKey(state, "5");
    state = applyAmountKeypadKey(state, "1");
    state = applyAmountKeypadKey(state, "+");
    state = applyAmountKeypadKey(state, "5");
    state = applyAmountKeypadKey(state, "0");
    state = applyAmountKeypadKey(state, "+");

    expect(getAmountKeypadPreviewValue(state)).toBe("101");
    expect(getAmountKeypadExpressionText(state)).toBe("51 + 50 +");

    state = applyAmountKeypadKey(state, "2");

    expect(getAmountKeypadPreviewValue(state)).toBe("103");
    expect(getAmountKeypadExpressionText(state)).toBe("51 + 50 + 2");

    const result = confirmAmountKeypadState(state);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBe("103");
  });

  it("确认时将空显示视为 0，但拒绝减到负数的金额", () => {
    const emptyResult = confirmAmountKeypadState(createAmountKeypadState());
    expect(emptyResult.ok).toBe(true);
    if (emptyResult.ok) expect(emptyResult.value).toBe("0");

    const zeroResult = confirmAmountKeypadState(createAmountKeypadState("0"));
    expect(zeroResult.ok).toBe(true);
    if (zeroResult.ok) expect(zeroResult.value).toBe("0");

    let state = createAmountKeypadState("1");
    state = applyAmountKeypadKey(state, "-");
    state = applyAmountKeypadKey(state, "2");

    const negativeResult = confirmAmountKeypadState(state);
    expect(negativeResult.ok).toBe(false);
    expect(getAmountKeypadPreviewValue(negativeResult.state)).toBe("-1");
    expect(getAmountKeypadExpressionText(negativeResult.state)).toBe("1 - 2");
  });
});
