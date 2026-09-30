import { describe, expect, it } from "vitest";

import {
  bottomNavigationLayout,
  stackedFeedbackBottomOffset,
} from "./bottomNavigationLayout";

describe("stackedFeedbackBottomOffset", () => {
  it("第一条提示条与共用提示条偏移位置相同", () => {
    expect(stackedFeedbackBottomOffset(0)).toBe(
      `calc(${bottomNavigationLayout.feedbackBottomOffset} + 0px)`,
    );
  });

  it("后续提示条按 88px 间距向上叠放", () => {
    expect(stackedFeedbackBottomOffset(2)).toBe(
      "calc(calc(calc(80px + env(safe-area-inset-bottom)) + 8px) + 176px)",
    );
  });
});
