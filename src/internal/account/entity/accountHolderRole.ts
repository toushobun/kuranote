export const accountHolderRoles = ["owner", "co_owner"] as const;

export type AccountHolderRole = (typeof accountHolderRoles)[number];
