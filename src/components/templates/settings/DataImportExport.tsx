"use client";

import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import ButtonBase from "@mui/material/ButtonBase";
import Stack from "@mui/material/Stack";
import type { SvgIconProps } from "@mui/material/SvgIcon";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import type { ElementType } from "react";

import {
  dataImportExportEntryMessages,
  dataImportExportPageMessages,
} from "config/dataImportExportMessages";
import { routePaths, type AppRoutePath } from "config/paths";
import { DataItemCard, dataItemCardPadding } from "atoms/ui/DataItemCard";
import { actionHoverInteractionSx } from "theme/actionHoverSx";
import { SettingsPageLayout } from "templates/layout/SettingsPageLayout";

export function DataImportExportTemplate() {
  return (
    <SettingsPageLayout
      back={{
        href: routePaths.settings,
        label: dataImportExportPageMessages.backToSettings,
      }}
      title={dataImportExportPageMessages.title}
      subtitle={dataImportExportPageMessages.subtitle}
    >
      <Stack spacing={1.5}>
        <DataTransferEntryCard
          description={dataImportExportEntryMessages.import.description}
          href={routePaths.settingsDataImport}
          icon={UploadFileOutlinedIcon}
          title={dataImportExportEntryMessages.import.title}
        />
        <DataTransferEntryCard
          description={dataImportExportEntryMessages.export.description}
          href={routePaths.settingsDataExport}
          icon={DownloadOutlinedIcon}
          title={dataImportExportEntryMessages.export.title}
        />
      </Stack>
    </SettingsPageLayout>
  );
}

type DataTransferEntryCardProps = {
  description: string;
  href: AppRoutePath;
  icon: ElementType<SvgIconProps>;
  title: string;
};

function DataTransferEntryCard({
  description,
  href,
  icon: Icon,
  title,
}: DataTransferEntryCardProps) {
  return (
    <DataItemCard disablePadding sx={{ overflow: "hidden" }}>
      <ButtonBase
        component={Link}
        href={href}
        sx={[dataTransferEntryButtonSx, actionHoverInteractionSx]}
      >
        <Stack sx={dataTransferEntryIconBoxSx}>
          <Icon fontSize="medium" />
        </Stack>

        <Stack spacing={0.25} sx={{ flex: 1, minWidth: 0 }}>
          <Typography component="span" sx={{ fontWeight: 700 }}>
            {title}
          </Typography>
          <Typography
            component="span"
            variant="body2"
            sx={{ color: "text.secondary" }}
          >
            {description}
          </Typography>
        </Stack>

        <ChevronRightRoundedIcon
          sx={{ color: "text.secondary", flexShrink: 0, fontSize: 22 }}
        />
      </ButtonBase>
    </DataItemCard>
  );
}

const dataTransferEntryButtonSx = {
  alignItems: "center",
  backgroundColor: "transparent",
  border: 0,
  color: "text.primary",
  display: "flex",
  gap: 1.5,
  p: dataItemCardPadding,
  textAlign: "left",
  textDecoration: "none",
  width: "100%",
} as const;

const dataTransferEntryIconBoxSx = {
  alignItems: "center",
  bgcolor: "var(--user-theme-icon-badge-bg)",
  borderRadius: "50%",
  color: "var(--user-theme-icon-badge-color)",
  display: "flex",
  flexShrink: 0,
  height: 40,
  justifyContent: "center",
  width: 40,
} as const;
