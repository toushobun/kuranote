import { vi } from "vitest";

/** 固定浏览器地区预选所读取的时区，不依赖运行测试的机器配置。 */
export function mockIntlTimeZone(timeZone: string) {
  const options = new Intl.DateTimeFormat().resolvedOptions();
  return vi
    .spyOn(Intl.DateTimeFormat.prototype, "resolvedOptions")
    .mockReturnValue({
      ...options,
      timeZone,
    });
}
