"use client";

import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import RadioButtonUncheckedRoundedIcon from "@mui/icons-material/RadioButtonUncheckedRounded";
import ButtonBase from "@mui/material/ButtonBase";
import Chip from "@mui/material/Chip";
import TextField from "@mui/material/TextField";
import Alert from "@mui/material/Alert";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
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
import { useState } from "react";
import { useDataExport } from "./useDataExport";

export function DataExportTemplate({
  exportAction,
}: {
  exportAction: DataExportAction;
}) {
  const [datesOpen, setDatesOpen] = useState(false);
  const {
    includePhotos,
    setIncludePhotos,
    photoProgress,
    isExporting,
    error,
    downloadedFile,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    recordTypes,
    toggleRecordType,
    canExport,
    invalidDateRange,
    handleExport,
    closeError,
  } = useDataExport(exportAction);
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
            <ButtonBase
              aria-expanded={datesOpen}
              disabled={isExporting}
              onClick={() => setDatesOpen((open) => !open)}
              sx={{
                justifyContent: "space-between",
                width: "100%",
                borderRadius: 1,
                py: 1,
                textAlign: "left",
                gap: 1,
              }}
            >
              <Typography variant="body2" sx={{ flexShrink: 0 }}>
                {messages.dateRange}
              </Typography>
              <Stack
                direction="row"
                spacing={0.5}
                sx={{ alignItems: "center", color: "text.secondary" }}
              >
                <Typography variant="body2" sx={{ textAlign: "right" }}>
                  {messages.dateSummary(startDate, endDate)}
                </Typography>
                <ChevronRightRoundedIcon fontSize="small" />
              </Stack>
            </ButtonBase>
            {datesOpen ? (
              <Stack direction="row" spacing={1}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label={messages.startDate}
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                  disabled={isExporting}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label={messages.endDate}
                  value={endDate}
                  error={invalidDateRange}
                  helperText={
                    invalidDateRange ? messages.invalidDateRange : undefined
                  }
                  onChange={(event) => setEndDate(event.target.value)}
                  disabled={isExporting}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Stack>
            ) : invalidDateRange ? (
              <Typography variant="caption" color="error">
                {messages.invalidDateRange}
              </Typography>
            ) : null}
            <Typography variant="body2">{messages.recordTypesTitle}</Typography>
            <Stack
              direction="row"
              useFlexGap
              spacing={0.5}
              sx={{ flexWrap: "wrap" }}
            >
              {(["normal", "transfer", "balance_adjustment"] as const).map(
                (type) => {
                  const selected = recordTypes.includes(type);
                  return (
                    <Chip
                      key={type}
                      role="checkbox"
                      aria-checked={selected}
                      label={messages.recordTypes[type]}
                      icon={
                        selected ? (
                          <CheckCircleRoundedIcon />
                        ) : (
                          <RadioButtonUncheckedRoundedIcon />
                        )
                      }
                      color={selected ? "primary" : "default"}
                      variant={selected ? "filled" : "outlined"}
                      disabled={isExporting}
                      onClick={() => toggleRecordType(type)}
                    />
                  );
                },
              )}
            </Stack>
            <Typography color="textSecondary" variant="body2">
              {messages.scope}
            </Typography>
          </Stack>
        </SectionCard>
        <SectionCard>
          <Stack spacing={1}>
            <FormControlLabel
              labelPlacement="start"
              sx={{ justifyContent: "space-between", mx: 0 }}
              control={
                <Switch
                  checked={includePhotos}
                  disabled={isExporting}
                  onChange={(_, checked) => setIncludePhotos(checked)}
                />
              }
              label={messages.includePhotos}
            />
            {includePhotos ? (
              <Typography color="textSecondary" variant="body2">
                {messages.photoSizeHint}
              </Typography>
            ) : null}
          </Stack>
        </SectionCard>
        <ActionButton
          pending={isExporting}
          pendingLabel={actionPendingMessages.export}
          disabled={!canExport}
          onClick={handleExport}
          variant="contained"
          fullWidth
        >
          {messages.button}
        </ActionButton>
        {photoProgress ? (
          <Typography role="status" color="textSecondary" variant="body2">
            {messages.photoProgress(photoProgress.done, photoProgress.total)}
          </Typography>
        ) : null}
        {downloadedFile ? (
          <Alert severity="success">{messages.success(downloadedFile)}</Alert>
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
