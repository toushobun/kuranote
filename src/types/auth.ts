export type BaseActionState = {
  error?: string;
  success?: string;
};

export type RegisterActionState = BaseActionState & {
  resetPassword?: boolean;
};

export type EmailAvailabilityState = BaseActionState;

export type LoginActionState = Pick<BaseActionState, "error">;
