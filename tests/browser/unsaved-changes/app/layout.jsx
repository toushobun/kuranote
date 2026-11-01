import { ConfirmDialogTestProviders } from "../../../../src/test/ConfirmDialogTestProviders";
import { RootLayoutShell } from "../../../../src/components/templates/root/RootLayoutShell";

export default function Layout({ children }) {
  return (
    <RootLayoutShell>
      <ConfirmDialogTestProviders>{children}</ConfirmDialogTestProviders>
    </RootLayoutShell>
  );
}
