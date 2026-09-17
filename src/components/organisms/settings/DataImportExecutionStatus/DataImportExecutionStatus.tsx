"use client";

import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import LinearProgress from "@mui/material/LinearProgress";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { dataImportExecutionMessages } from "config/dataImportExportMessages";
import { importSheetKindLabels, type ImportExecutionResult } from "internal/dataImport";
import { SectionCard } from "molecules/ui/SectionCard";

type DataImportExecutionStatusProps = {
  isDownloading?: boolean;
  onDownload?: () => void;
  result: ImportExecutionResult;
  status: "completed" | "importing";
};

export function DataImportExecutionStatus({
  isDownloading = false,
  onDownload,
  result,
  status,
}: DataImportExecutionStatusProps) {
  const messages = dataImportExecutionMessages;
  const progress =
    result.totalCount === 0
      ? 0
      : Math.min(100, (result.processedCount / result.totalCount) * 100);

  return (
    <SectionCard>
      <Stack spacing={2}>
        <Box>
          <Typography sx={{ fontWeight: 700 }}>
            {status === "importing"
              ? messages.progressTitle
              : messages.completedTitle}
          </Typography>
          <Typography sx={{ color: "text.secondary", mt: 0.5 }} variant="body2">
            {messages.progressLabel(result.processedCount, result.totalCount)}
          </Typography>
        </Box>

        {status === "importing" ? (
          <LinearProgress aria-label={messages.progressTitle} value={progress} variant="determinate" />
        ) : null}

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
          <Alert severity="success">{messages.successCount(result.successCount)}</Alert>
          {result.failureCount > 0 ? (
            <Alert severity="error">{messages.failureCount(result.failureCount)}</Alert>
          ) : null}
          {result.duplicateCount > 0 ? (
            <Alert severity="warning">
              {messages.duplicateCount(result.duplicateCount)}
            </Alert>
          ) : null}
        </Stack>

        {status === "completed" && result.details.length > 0 ? (
          <Stack spacing={1}>
            <Typography sx={{ fontWeight: 700 }} variant="body2">
              {messages.detailTitle}
            </Typography>
            <Stack component="ul" spacing={1} sx={{ listStyle: "none", m: 0, p: 0 }}>
              {result.details.map((detail, index) => (
                <Box component="li" key={`${detail.sheet}-${detail.rowNumbers.join("-")}-${index}`}>
                  <Typography sx={{ fontWeight: 600 }} variant="body2">
                    [{importSheetKindLabels[detail.sheet]}] {messages.detailRows(detail.rowNumbers)} · {detail.status === "duplicate" ? messages.duplicateLabel : messages.failedLabel}
                  </Typography>
                  <Typography sx={{ color: "text.secondary" }} variant="body2">
                    {detail.content}
                  </Typography>
                  <Typography variant="body2">{detail.reason}</Typography>
                </Box>
              ))}
            </Stack>
          </Stack>
        ) : null}

        {status === "completed" && onDownload ? (
          <Button
            disabled={isDownloading}
            onClick={onDownload}
            startIcon={<DownloadRoundedIcon />}
            sx={{ alignSelf: "flex-start" }}
            variant="outlined"
          >
            {isDownloading
              ? messages.downloadingButton
              : messages.downloadButton}
          </Button>
        ) : null}
      </Stack>
    </SectionCard>
  );
}
