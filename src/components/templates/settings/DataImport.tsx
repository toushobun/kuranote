"use client";

import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import ErrorRoundedIcon from "@mui/icons-material/ErrorRounded";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Link from "next/link";

import {
  dataImportExecutionMessages,
  dataImportFileFieldMessages,
  dataImportFormatDescriptionMessages,
  dataImportPageMessages,
  dataImportResultMessages,
  dataTransferBackMessages,
} from "config/dataImportExportMessages";
import { routePaths } from "config/paths";
import type { AccountImportHolder } from "internal/account";
import type { LedgerPlaceholderMemberSummary } from "internal/ledger";
import {
  importColumnsBySheetKind,
  importSheetKindLabels,
  type ImportColumnDef,
  type ImportValidationIssue,
  type ImportValidationResult,
} from "internal/dataImport";
import { SectionCard } from "molecules/ui/SectionCard";
import { DataImportHolderMapping } from "organisms/settings/DataImportHolderMapping/DataImportHolderMapping";
import { DataImportExecutionStatus } from "organisms/settings/DataImportExecutionStatus/DataImportExecutionStatus";
import { PageHeader } from "templates/layout/PageHeader";
import { PageShell } from "templates/layout/PageShell";
import { useDataImportForm } from "templates/settings/useDataImportForm";
import type { DataImportBatchStateAction } from "types/dataImport";

type DataImportTemplateProps = {
  /** 当前用户是否为 owner/admin；只有这时映射步骤才提供「新建待邀请成员」。 */
  canCreatePlaceholders?: boolean;
  executeBatchAction: DataImportBatchStateAction;
  /** 当前账本的 active 成员，用于持有人映射步骤的下拉候选。 */
  holderMembers: AccountImportHolder[];
  /** 当前账本未认领的待邀请成员，用于持有人映射步骤的下拉候选。 */
  holderPlaceholders?: LedgerPlaceholderMemberSummary[];
};

export function DataImportTemplate({
  canCreatePlaceholders = false,
  executeBatchAction,
  holderMembers,
  holderPlaceholders = [],
}: DataImportTemplateProps) {
  const {
    displayProgress,
    downloadError,
    executionError,
    executionResult,
    executionStatus,
    handleCancelHolderMapping,
    handleCheckFormat,
    handleConfirmHolderMapping,
    handleDownloadResult,
    handleFileChange,
    handleStartImport,
    holderMappingCandidates,
    isChecking,
    isDownloading,
    isImporting,
    selectedFileName,
    validationState,
  } = useDataImportForm(executeBatchAction, holderMembers);

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
        title={dataImportPageMessages.title}
        subtitle={dataImportPageMessages.subtitle}
        variant="compact"
      />

      <Stack spacing={2.5} sx={{ mt: 3 }}>
        <FormatDescriptionCard />

        <SectionCard>
          <Stack spacing={1.5}>
            <Typography sx={{ fontWeight: 700 }}>
              {dataImportFileFieldMessages.chooseFileButton}
            </Typography>

            <Button
              component="label"
              disabled={isChecking || isImporting}
              startIcon={<UploadFileOutlinedIcon />}
              sx={{ alignSelf: "flex-start" }}
              variant="outlined"
            >
              {dataImportFileFieldMessages.chooseFileButton}
              <input
                accept=".xlsx"
                aria-label={dataImportFileFieldMessages.chooseFileButton}
                disabled={isChecking || isImporting}
                hidden
                name="file"
                onChange={handleFileChange}
                type="file"
              />
            </Button>

            <Typography sx={{ color: "text.secondary" }} variant="body2">
              {selectedFileName ?? dataImportFileFieldMessages.noFileSelected}
            </Typography>

            {validationState.error ? (
              <Alert severity="error">{validationState.error}</Alert>
            ) : null}

            <Button
              disabled={
                isChecking ||
                isImporting ||
                !selectedFileName ||
                executionStatus !== null
              }
              onClick={handleCheckFormat}
              variant="contained"
            >
              {isChecking
                ? dataImportFileFieldMessages.checking
                : dataImportFileFieldMessages.checkFormatButton}
            </Button>
          </Stack>
        </SectionCard>

        {validationState.result ? (
          <ResultSection result={validationState.result} />
        ) : null}

        {validationState.result?.ok &&
        executionStatus === null &&
        holderMappingCandidates.length > 0 ? (
          <DataImportHolderMapping
            canCreatePlaceholders={canCreatePlaceholders}
            candidates={holderMappingCandidates}
            members={holderMembers}
            onCancel={handleCancelHolderMapping}
            onConfirm={handleConfirmHolderMapping}
            placeholders={holderPlaceholders}
          />
        ) : null}

        {validationState.result?.ok &&
        executionStatus === null &&
        holderMappingCandidates.length === 0 ? (
          <SectionCard>
            <Button
              disabled={isImporting}
              fullWidth
              onClick={handleStartImport}
              variant="contained"
            >
              {isImporting
                ? dataImportExecutionMessages.importingButton
                : dataImportExecutionMessages.startButton}
            </Button>
          </SectionCard>
        ) : null}

        {executionError ? (
          <Alert severity="error">{executionError}</Alert>
        ) : null}

        {executionResult && executionStatus ? (
          <DataImportExecutionStatus
            displayProgress={displayProgress ?? undefined}
            isDownloading={isDownloading}
            onDownload={
              executionStatus === "completed" ? handleDownloadResult : undefined
            }
            result={executionResult}
            status={executionStatus}
          />
        ) : null}

        {downloadError ? <Alert severity="error">{downloadError}</Alert> : null}
      </Stack>
    </PageShell>
  );
}

function ColumnList({ columns }: { columns: ImportColumnDef[] }) {
  return (
    <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
      {columns.map((column) => (
        <Typography component="li" key={column.name} variant="body2">
          {column.name}
          {column.required ? "*" : ""}
        </Typography>
      ))}
    </Box>
  );
}

function FormatDescriptionCard() {
  const messages = dataImportFormatDescriptionMessages;

  return (
    <SectionCard>
      <Stack spacing={1.5}>
        <Typography sx={{ fontWeight: 700 }}>{messages.title}</Typography>

        <Stack
          component="ul"
          spacing={0.5}
          sx={{ listStyle: "none", m: 0, p: 0 }}
        >
          {[
            messages.fileTypeHint,
            messages.unknownColumnHint,
            messages.holderColumnHint,
            messages.accountTypeColumnHint,
            messages.recorderColumnHint,
            messages.billRefHint,
            messages.balanceAdjustmentHint,
          ].map((hint) => (
            <Typography
              component="li"
              key={hint}
              sx={{ color: "text.secondary" }}
              variant="body2"
            >
              {hint}
            </Typography>
          ))}
        </Stack>

        <Typography sx={{ fontWeight: 700 }} variant="body2">
          {messages.incomeExpenseColumnsTitle}
        </Typography>
        <ColumnList columns={importColumnsBySheetKind.incomeExpense} />

        <Typography sx={{ fontWeight: 700 }} variant="body2">
          {messages.transferColumnsTitle}
        </Typography>
        <ColumnList columns={importColumnsBySheetKind.transfer} />
        <Typography sx={{ fontWeight: 700 }} variant="body2">
          {messages.balanceAdjustmentColumnsTitle}
        </Typography>
        <ColumnList columns={importColumnsBySheetKind.balanceAdjustment} />
      </Stack>
    </SectionCard>
  );
}

function formatIssue(issue: ImportValidationIssue): string {
  if (issue.kind === "structural") {
    return issue.sheet
      ? `[${importSheetKindLabels[issue.sheet]}] ${issue.message}`
      : issue.message;
  }

  const rowLabel = dataImportResultMessages.issueRowLabel(issue.rowNumber);
  const columnLabel = issue.column ? `「${issue.column}」` : "";

  return `[${importSheetKindLabels[issue.sheet]}] ${rowLabel} ${columnLabel} ${issue.message}`;
}

function ResultSection({ result }: { result: ImportValidationResult }) {
  if (result.ok) {
    return (
      <Alert icon={<CheckCircleRoundedIcon />} severity="success">
        <Typography sx={{ fontWeight: 700 }}>
          {dataImportResultMessages.successTitle}
        </Typography>
        <Typography variant="body2">
          {dataImportResultMessages.incomeExpenseCountLabel(
            result.summary.incomeExpenseCount,
          )}
          ，
          {dataImportResultMessages.transferCountLabel(
            result.summary.transferCount,
          )}
        </Typography>
        <Typography variant="body2">
          {dataImportResultMessages.balanceAdjustmentCountLabel(
            result.summary.balanceAdjustmentCount,
          )}
        </Typography>
      </Alert>
    );
  }

  return (
    <Alert icon={<ErrorRoundedIcon />} severity="error">
      <Typography sx={{ fontWeight: 700 }}>
        {dataImportResultMessages.failureTitle}
      </Typography>
      <Stack
        component="ul"
        spacing={0.5}
        sx={{ listStyle: "none", m: 0, mt: 1, p: 0 }}
      >
        {result.issues.map((issue, index) => (
          <Typography component="li" key={index} variant="body2">
            {formatIssue(issue)}
          </Typography>
        ))}
      </Stack>
    </Alert>
  );
}
