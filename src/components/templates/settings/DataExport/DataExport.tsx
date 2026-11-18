"use client";

import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import Alert from "@mui/material/Alert";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { ActionButton } from "atoms/ui/ActionButton/ActionButton";
import { actionPendingMessages } from "config/actionPendingMessages";
import {
  dataExportPageMessages as messages,
  dataTransferBackMessages,
} from "config/dataImportExportMessages";
import { routePaths } from "config/paths";
import { FailureFeedbackDialog } from "molecules/ui/OperationFeedbackDialogs";
import { SectionCard } from "molecules/ui/SectionCard";
import { SettingsPageLayout } from "templates/layout/SettingsPageLayout";
import type { DataExportAction } from "types/dataExport";
import { useDataExport } from "./useDataExport";

export function DataExportTemplate({
  exportAction,
}: {
  exportAction: DataExportAction;
}) {
  const { isExporting, error, hasDownloaded, handleExport, closeError } =
    useDataExport(exportAction);
  return (
    <SettingsPageLayout
      back={{
        href: routePaths.settingsData,
        label: dataTransferBackMessages.backToEntry,
      }}
      title={messages.title}
      subtitle={messages.subtitle}
    >
      <Stack spacing={2.5}>
        <SectionCard>
          <Stack spacing={1.5}>
            <Typography sx={{ fontWeight: 700 }}>
              {messages.scopeTitle}
            </Typography>
            {[messages.scope, messages.format, messages.empty].map((text) => (
              <Typography key={text} color="textSecondary" variant="body2">
                {text}
              </Typography>
            ))}
            <ActionButton
              pending={isExporting}
              pendingLabel={actionPendingMessages.export}
              onClick={handleExport}
              startIcon={<DownloadRoundedIcon />}
              variant="contained"
              fullWidth
            >
              {messages.button}
            </ActionButton>
          </Stack>
        </SectionCard>
        {hasDownloaded ? (
          <Alert severity="success">{messages.success}</Alert>
        ) : null}
      </Stack>
      <FailureFeedbackDialog
        open={error !== null}
        onClose={closeError}
        title={messages.failureTitle}
        description={error}
      />
    </SettingsPageLayout>
  );
}
