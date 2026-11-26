"use client";

import Alert from "@mui/material/Alert";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { dataImportExecutionMessages as messages } from "config/dataImportExportMessages";
import type { ImportExecutionResult } from "internal/dataImport";
import { SectionCard } from "molecules/ui/SectionCard";
import { DataImportIssueList } from "organisms/settings/DataImportIssueList/DataImportIssueList";
import { groupExecutionIssues } from "utils/groupDataImportIssues";

export function DataImportExecutionStatus({
  result,
}: {
  result: ImportExecutionResult;
}) {
  const failed = groupExecutionIssues(
    result.details.filter((detail) => detail.status === "failed"),
  );
  const holderMissing = groupExecutionIssues(
    result.details.filter((detail) => detail.status === "holderMissing"),
  );
  const severity =
    result.failureCount === 0
      ? "success"
      : result.successCount === 0
        ? "error"
        : "warning";
  const title =
    severity === "success"
      ? messages.successTitle(result.successCount)
      : severity === "error"
        ? messages.failureTitle
        : messages.partialTitle(result.successCount, result.failureCount);

  return (
    <SectionCard>
      <Stack spacing={1.5}>
        <Alert severity={severity}>
          <Typography sx={{ fontWeight: 700 }}>{title}</Typography>
        </Alert>
        {failed.length > 0 ? <DataImportIssueList issues={failed} /> : null}
        {holderMissing.length > 0 ? (
          <Stack spacing={1}>
            <Typography sx={{ color: "warning.main" }} variant="body2">
              {messages.holderMissingCount(result.holderMissingCount)}
            </Typography>
            <DataImportIssueList issues={holderMissing} />
          </Stack>
        ) : null}
        {result.createdPlaceholderCount > 0 ? (
          <Typography variant="body2">
            {messages.createdPlaceholderCount(result.createdPlaceholderCount)}
          </Typography>
        ) : null}
      </Stack>
    </SectionCard>
  );
}
