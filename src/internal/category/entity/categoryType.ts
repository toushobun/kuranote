export const categoryTypes = ["expense", "income"] as const;

export type CategoryType = (typeof categoryTypes)[number];
