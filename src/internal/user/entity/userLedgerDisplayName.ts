/** 当前用户所属 active 账本，以及该账本内的有效昵称（为空时已回退到账号昵称）。 */
export type UserLedgerDisplayName = {
  displayName: string;
  ledgerId: string;
  ledgerName: string;
};
