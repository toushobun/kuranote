import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import HourglassEmptyRoundedIcon from "@mui/icons-material/HourglassEmptyRounded";
import IconButton from "@mui/material/IconButton";
import Link from "next/link";

import {
  dataTransferBackMessages,
  dataTransferPlaceholderMessages,
} from "config/dataImportExportMessages";
import { routePaths } from "config/paths";
import { EmptyState } from "molecules/ui/EmptyState";
import { PageHeader } from "templates/layout/PageHeader";
import { PageShell } from "templates/layout/PageShell";

type DataTransferPlaceholderKind = "export" | "import";

type DataTransferPlaceholderProps = {
  kind: DataTransferPlaceholderKind;
};

export function DataTransferPlaceholderTemplate({
  kind,
}: DataTransferPlaceholderProps) {
  const messages = dataTransferPlaceholderMessages[kind];

  return (
    <PageShell maxWidth="sm">
      <PageHeader
        leading={
          <IconButton
            aria-label={dataTransferBackMessages.backToEntry}
            component={Link}
            href={routePaths.settingsData}
          >
            <ArrowBackRoundedIcon />
          </IconButton>
        }
        title={messages.title}
        variant="compact"
      />

      <EmptyState
        description={messages.comingSoonDescription}
        illustration={
          <HourglassEmptyRoundedIcon
            sx={{ color: "text.secondary", fontSize: 40 }}
          />
        }
        title={messages.comingSoonTitle}
      />
    </PageShell>
  );
}
