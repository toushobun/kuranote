"use client";

import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import HourglassEmptyRoundedIcon from "@mui/icons-material/HourglassEmptyRounded";
import IconButton from "@mui/material/IconButton";
import Link from "next/link";

import {
  dataExportPlaceholderMessages,
  dataTransferBackMessages,
} from "config/dataImportExportMessages";
import { routePaths } from "config/paths";
import { EmptyState } from "molecules/ui/EmptyState";
import { PageHeader } from "templates/layout/PageHeader";
import { PageShell } from "templates/layout/PageShell";

export function DataTransferPlaceholderTemplate() {
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
        title={dataExportPlaceholderMessages.title}
        variant="compact"
      />

      <EmptyState
        description={dataExportPlaceholderMessages.comingSoonDescription}
        illustration={
          <HourglassEmptyRoundedIcon
            sx={{ color: "text.secondary", fontSize: 40 }}
          />
        }
        title={dataExportPlaceholderMessages.comingSoonTitle}
      />
    </PageShell>
  );
}
