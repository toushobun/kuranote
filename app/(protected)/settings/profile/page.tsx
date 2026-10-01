import {
  changePassword,
  logout,
  requestPasswordChangeOtp,
} from "internal/auth/adapter/next/actions";
import { getCurrentLedgerContext } from "internal/ledger/adapter/next/currentLedger";
import {
  updateAvatar,
  updateDisplayName,
} from "internal/user/adapter/next/actions";
import { loadSettingsProfileView } from "internal/user/adapter/next/loadSettingsProfileView";
import { SettingsProfileTemplate } from "templates/settings/SettingsProfile";

export default async function SettingsProfileRoute() {
  const [{ ledgerDisplayNames, profile }, { currentLedger }] =
    await Promise.all([loadSettingsProfileView(), getCurrentLedgerContext()]);

  return (
    <SettingsProfileTemplate
      changePasswordAction={changePassword}
      currentLedgerId={currentLedger?.id ?? null}
      ledgers={ledgerDisplayNames}
      logoutAction={logout}
      profile={profile}
      requestPasswordChangeOtpAction={requestPasswordChangeOtp}
      updateAvatarAction={updateAvatar}
      updateDisplayNameAction={updateDisplayName}
    />
  );
}
