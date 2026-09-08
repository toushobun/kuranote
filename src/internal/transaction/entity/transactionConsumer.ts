import type { ThemeColorKey } from "theme/themeColorTokens";

export type TransactionConsumer = {
  color: ThemeColorKey | null;
  id: string;
  name: string;
};
