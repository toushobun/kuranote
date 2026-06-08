import { logout } from "server/actions/session";
import { loadSettingsView } from "server/loaders/settings";
import { SettingsTemplate } from "templates/settings/Settings";

export async function SettingsPage() {
  const view = await loadSettingsView();

  return <SettingsTemplate logoutAction={logout} {...view} />;
}
