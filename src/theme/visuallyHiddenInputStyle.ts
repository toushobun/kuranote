/**
 * 自绘单选 / 复选外观时隐藏原生 input：视觉上不可见但仍可聚焦，
 * 键盘、读屏与浏览器 required 校验照常作用在原生 input 上。
 */
export const visuallyHiddenInputStyle = {
  height: 1,
  opacity: 0,
  position: "absolute",
  width: 1,
} as const;
