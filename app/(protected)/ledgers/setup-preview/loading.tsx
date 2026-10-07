import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";

import { ledgerSetupPreviewPageMessages } from "config/ledgerSetupMessages";
import { SettingsPageLayout } from "templates/layout/SettingsPageLayout";

export default function LedgerSetupPreviewLoadingPage() {
  return (
    <Box
      aria-busy="true"
      aria-label={ledgerSetupPreviewPageMessages.loading}
      role="status"
    >
      <SettingsPageLayout
        subtitle={ledgerSetupPreviewPageMessages.description}
        title={ledgerSetupPreviewPageMessages.title}
      >
        <Skeleton
          data-testid="ledger-setup-preview-loading-open"
          height={48}
          variant="rounded"
          width="100%"
        />
      </SettingsPageLayout>
    </Box>
  );
}
