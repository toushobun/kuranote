"use client";

import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import LinearProgress from "@mui/material/LinearProgress";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { dataImportExecutionMessages } from "config/dataImportExportMessages";
import {
  importSheetKindLabels,
  type ImportExecutionResult,
} from "internal/dataImport";
import { SectionCard } from "molecules/ui/SectionCard";
import { toProgressPercentage } from "utils/simulatedImportProgress";

type DataImportExecutionStatusProps = {
  displayProgress?: number;
  isDownloading?: boolean;
  onDownload?: () => void;
  result: ImportExecutionResult;
  status: "completed" | "importing";
};

export function DataImportExecutionStatus({
  displayProgress,
  isDownloading = false,
  onDownload,
  result,
  status,
}: DataImportExecutionStatusProps) {
  const messages = dataImportExecutionMessages;
  const realProgress = toProgressPercentage(
    result.processedCount,
    result.totalCount,
  );
  const progress =
    status === "completed" ? 100 : (displayProgress ?? realProgress);
  const failedDetails = result.details.filter(
    (detail) => detail.status === "failed",
  );
  const duplicateDetails = result.details.filter(
    (detail) => detail.status === "duplicate",
  );
  const holderMissingDetails = result.details.filter(
    (detail) => detail.status === "holderMissing",
  );

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

        <LinearProgress
          aria-label={messages.progressTitle}
          aria-valuetext={messages.progressLabel(
            result.processedCount,
            result.totalCount,
          )}
          value={progress}
          variant="determinate"
        />

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
          <Alert severity="success">
            {messages.successCount(result.successCount)}
          </Alert>
          {result.failureCount > 0 ? (
            <Alert severity="error">
              {messages.failureCount(result.failureCount)}
            </Alert>
          ) : null}
          {result.duplicateCount > 0 ? (
            <Alert severity="warning">
              {messages.duplicateCount(result.duplicateCount)}
            </Alert>
          ) : null}
          {result.holderMissingCount > 0 ? (
            <Alert severity="warning">
              {messages.holderMissingCount(result.holderMissingCount)}
            </Alert>
          ) : null}
        </Stack>

        {status === "completed" && failedDetails.length > 0 ? (
          <DetailList
            items={failedDetails}
            title={messages.failedDetailTitle}
          />
        ) : null}

        {status === "completed" && duplicateDetails.length > 0 ? (
          <DetailList
            items={duplicateDetails}
            title={messages.duplicateDetailTitle}
          />
        ) : null}

        {status === "completed" && holderMissingDetails.length > 0 ? (
          <DetailList
            items={holderMissingDetails}
            title={messages.holderMissingDetailTitle}
          />
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

function DetailList({
  items,
  title,
}: {
  items: ImportExecutionResult["details"];
  title: string;
}) {
  return (
    <Stack spacing={1}>
      <Typography sx={{ fontWeight: 700 }} variant="body2">
        {title}
      </Typography>
      <Stack component="ul" spacing={1} sx={{ listStyle: "none", m: 0, p: 0 }}>
        {items.map((detail, index) => (
          <Box
            component="li"
            key={`${detail.sheet}-${detail.rowNumbers.join("-")}-${index}`}
          >
            <Typography sx={{ fontWeight: 600 }} variant="body2">
              [{importSheetKindLabels[detail.sheet]}]{" "}
              {dataImportExecutionMessages.detailRows(detail.rowNumbers)}
            </Typography>
            <Typography sx={{ color: "text.secondary" }} variant="body2">
              {detail.content}
            </Typography>
            <Typography variant="body2">{detail.reason}</Typography>
          </Box>
        ))}
      </Stack>
    </Stack>
  );
}
