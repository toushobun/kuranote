import Skeleton from "@mui/material/Skeleton";

import { accountFormMessages } from "config/accountMessages";
import { routePaths } from "config/paths";
import { LoadingState } from "molecules/ui/LoadingState";
import { SettingsPageLayout } from "templates/layout/SettingsPageLayout";

export default function AccountCreateLoading() {
  return (
    <SettingsPageLayout
      back={{
        href: routePaths.accounts,
        label: accountFormMessages.backToAccounts,
      }}
      subtitle={<Skeleton sx={{ maxWidth: "100%" }} width={200} />}
      title={accountFormMessages.createTitle}
    >
      <LoadingState description={accountFormMessages.loading} />
    </SettingsPageLayout>
  );
}
