import { updateTransactionColorScheme } from "internal/user/adapter/next/actions";
import { SettingsPreferencesTemplate } from "templates/settings/SettingsPreferences";

export default function SettingsPreferencesRoute() {
  return (
    <SettingsPreferencesTemplate
      updateTransactionColorSchemeAction={updateTransactionColorScheme}
    />
  );
}
