import Skeleton from "@mui/material/Skeleton";

import { accountFormMessages } from "config/accountMessages";
import { AccountFormPageSkeleton } from "templates/accounts/AccountFormPageSkeleton";

export default function AccountEditLoading() {
  return (
    <AccountFormPageSkeleton
      action={<Skeleton aria-hidden height={30} width={64} />}
      loadingLabel={accountFormMessages.editLoading}
      title={accountFormMessages.editTitle}
    />
  );
}
