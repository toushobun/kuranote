import { vi } from "vitest";

export const routerMock = { push: vi.fn(), replace: vi.fn() };
export function useRouter() {
  return routerMock;
}
