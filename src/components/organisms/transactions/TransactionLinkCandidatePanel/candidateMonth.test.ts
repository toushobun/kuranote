import { describe, expect, it } from "vitest";
import {
  candidateInMonth,
  changeCandidateMonth,
  toTokyoCandidateMonth,
} from "./candidateMonth";

describe("candidateMonth", () => {
  it("按东京自然月计算，UTC 月末边界不会误归到相邻月份", () => {
    expect(toTokyoCandidateMonth("2026-10-31T14:59:59Z")).toBe("2026-10");
    expect(toTokyoCandidateMonth("2026-10-31T15:00:00Z")).toBe("2026-11");
    expect(candidateInMonth("2026-10-31T15:00:00Z", "2026-11")).toBe(true);
    expect(candidateInMonth("2026-10-31T15:00:00Z", "2026-10")).toBe(false);
    expect(candidateInMonth("2026-10-31T15:00:00Z", null)).toBe(true);
  });

  it("箭头切月跨年保持两位月份并且不依赖浏览器时区", () => {
    expect(changeCandidateMonth("2026-01", -1)).toBe("2025-12");
    expect(changeCandidateMonth("2026-12", 1)).toBe("2027-01");
  });
});
