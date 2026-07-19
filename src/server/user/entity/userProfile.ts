export const userStatuses = ["active", "disabled"] as const;

export type UserStatus = (typeof userStatuses)[number];

export type UserProfile = {
  avatarUrl: string | null;
  displayName: string;
  email: string | null;
  id: string;
  status: UserStatus;
};
