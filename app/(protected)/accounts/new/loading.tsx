import { accountFormMessages } from "config/accountMessages";
import { AccountFormPageSkeleton } from "templates/accounts/AccountFormPageSkeleton";

export default function AccountCreateLoading() {
  return (
    <AccountFormPageSkeleton
      loadingLabel={accountFormMessages.loading}
      title={accountFormMessages.createTitle}
    />
  );
}
