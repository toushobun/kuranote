import {
  changePassword,
  logout,
  requestPasswordChangeOtp,
  startGoogleIdentityLink,
  unlinkGoogleIdentity,
} from "internal/auth/adapter/next/actions";
import { loadGoogleIdentityLinkView } from "internal/auth/adapter/next/loadGoogleIdentityLinkView";
import { getCurrentLedgerContext } from "internal/ledger/adapter/next/currentLedger";
import {
  updateAvatar,
  updateDisplayName,
} from "internal/user/adapter/next/actions";
import { loadSettingsProfileView } from "internal/user/adapter/next/loadSettingsProfileView";
import { SettingsProfileTemplate } from "templates/settings/SettingsProfile";

export default async function SettingsProfileRoute({
  searchParams,
}: {
  searchParams: Promise<{ linkResult?: string | string[] }>;
}) {
  const { linkResult } = await searchParams;
  const [
    { ledgerDisplayNames, profile },
    { currentLedger },
    { googleIdentity, linkFeedback },
  ] = await Promise.all([
    loadSettingsProfileView(),
    getCurrentLedgerContext(),
    loadGoogleIdentityLinkView(
      typeof linkResult === "string" ? linkResult : undefined,
    ),
  ]);

  return (
    <SettingsProfileTemplate
      changePasswordAction={changePassword}
      currentLedgerId={currentLedger?.id ?? null}
      googleIdentity={googleIdentity}
      googleIdentityLinkFeedback={linkFeedback}
      ledgers={ledgerDisplayNames}
      linkGoogleIdentityAction={startGoogleIdentityLink}
      logoutAction={logout}
      profile={profile}
      requestPasswordChangeOtpAction={requestPasswordChangeOtp}
      unlinkGoogleIdentityAction={unlinkGoogleIdentity}
      updateAvatarAction={updateAvatar}
      updateDisplayNameAction={updateDisplayName}
    />
  );
}
