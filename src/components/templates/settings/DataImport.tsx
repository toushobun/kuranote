"use client";

import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { ActionButton } from "atoms/ui/ActionButton/ActionButton";
import {
  dataImportExecutionMessages as executionMessages,
  dataImportFileFieldMessages as fileMessages,
  dataImportFormatDescriptionMessages as formatMessages,
  dataImportPageMessages,
  dataImportResultMessages as resultMessages,
  dataTransferBackMessages,
} from "config/dataImportExportMessages";
import { routePaths } from "config/paths";
import type { AccountImportHolder } from "internal/account";
import type { LedgerPlaceholderMemberSummary } from "internal/ledger";
import {
  importColumnsBySheetKind,
  incomeExpensePhotoColumns,
  type ImportColumnDef,
  type ImportValidationResult,
} from "internal/dataImport";
import { SectionCard } from "molecules/ui/SectionCard";
import { DataImportHolderMapping } from "organisms/settings/DataImportHolderMapping/DataImportHolderMapping";
import { DataImportIssueList } from "organisms/settings/DataImportIssueList";
import { DataImportExecutionStatus } from "organisms/settings/DataImportExecutionStatus/DataImportExecutionStatus";
import { SettingsPageLayout } from "templates/layout/SettingsPageLayout";
import { useDataImportForm } from "templates/settings/useDataImportForm";
import type { DataImportBatchStateAction } from "types/dataImport";
import { groupValidationIssues } from "utils/groupDataImportIssues";

type DataImportTemplateProps = {
  /** 当前用户是否为 owner/admin；只有这时映射步骤才提供「新建待邀请成员」。 */
  canCreatePlaceholders?: boolean;
  executeBatchAction: DataImportBatchStateAction;
  ledgerId?: string;
  /** 当前账本的 active 成员，用于持有人映射步骤的下拉候选。 */
  holderMembers: AccountImportHolder[];
  /** 当前账本未认领的待邀请成员，用于持有人映射步骤的下拉候选。 */
  holderPlaceholders?: LedgerPlaceholderMemberSummary[];
};

export function DataImportTemplate({
  canCreatePlaceholders = false,
  executeBatchAction,
  holderMembers,
  ledgerId,
  holderPlaceholders = [],
}: DataImportTemplateProps) {
  const {
    executionError,
    executionResult,
    executionStatus,
    handleCancelHolderMapping,
    handleConfirmHolderMapping,
    handleFileChange,
    handleStartImport,
    holderMappingCandidates,
    isChecking,
    isImporting,
    selectedFileName,
    photoCount,
    photoUploadProgress,
    validationState,
  } = useDataImportForm(executeBatchAction, holderMembers, ledgerId);

  const result = validationState.result;
  const mappingRequired = holderMappingCandidates.length > 0;

  return (
    <SettingsPageLayout
      back={{
        href: routePaths.settingsData,
        label: dataTransferBackMessages.backToEntry,
      }}
      title={dataImportPageMessages.title}
      subtitle={dataImportPageMessages.subtitle}
    >
      <Stack spacing={2.5}>
        <SectionCard>
          <Stack spacing={1.5}>
            {!selectedFileName ? (
              <Typography color="textSecondary" variant="body2">
                {fileMessages.description}
              </Typography>
            ) : null}
            <Stack direction={selectedFileName ? "row" : "column"} spacing={1}
              sx={{ alignItems: "center" }}>
              {selectedFileName ? (
                <>
                  {isChecking ? (
                    <CircularProgress size={20} aria-label={fileMessages.checking} />
                  ) : (
                    <DescriptionOutlinedIcon color="action" />
                  )}
                  <Typography variant="body2" sx={{ flex: 1, minWidth: 0, overflowWrap: "anywhere" }}>
                    {selectedFileName}
                  </Typography>
                </>
              ) : null}
              <Button
                component="label"
                disabled={isImporting}
                startIcon={selectedFileName ? undefined : <UploadFileOutlinedIcon />}
                variant="outlined"
                fullWidth={!selectedFileName}
                sx={{ flexShrink: 0 }}
              >
                {selectedFileName ? fileMessages.reselectButton : fileMessages.chooseFileButton}
                <input
                  accept=".xlsx"
                  aria-label={fileMessages.chooseFileButton}
                  disabled={isImporting}
                  hidden
                  name="file"
                  onChange={handleFileChange}
                  type="file"
                />
              </Button>
              {!selectedFileName ? (
                <Typography color="textSecondary" variant="body2">
                  {fileMessages.noFileSelected}
                </Typography>
              ) : null}
            </Stack>
            {validationState.error ? (
              <Alert severity="error">{validationState.error}</Alert>
            ) : null}
          </Stack>
        </SectionCard>

        <FormatDescriptionCard />

        {result && !result.ok ? <ValidationErrors result={result} /> : null}

        {result?.ok && executionStatus !== "completed" ? (
          <SectionCard>
            <Stack spacing={1.5}>
              <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                <CheckCircleRoundedIcon color="success" />
                <Typography sx={{ fontWeight: 700 }}>
                  {resultMessages.successTitle}
                </Typography>
              </Stack>
              <Typography variant="body2" color="textSecondary">
                {summaryText(result, photoCount)}
              </Typography>
              {!mappingRequired || isImporting ? (
                <ActionButton
                  fullWidth
                  onClick={handleStartImport}
                  pending={isImporting}
                  pendingLabel={executionMessages.importingButton}
                  variant="contained"
                >
                  {executionMessages.startButton}
                </ActionButton>
              ) : null}
              {isImporting ? (
                <Typography textAlign="center" color="textSecondary" variant="body2">
                  {executionMessages.keepPageOpenHint}
                </Typography>
              ) : null}
              {isImporting && photoUploadProgress ? (
                <Typography variant="body2" color="textSecondary">
                  {executionMessages.photoUploadProgress(photoUploadProgress.done, photoUploadProgress.total)}
                </Typography>
              ) : null}
            </Stack>
          </SectionCard>
        ) : null}

        {result?.ok && executionStatus === null && mappingRequired ? (
          <DataImportHolderMapping
            canCreatePlaceholders={canCreatePlaceholders}
            candidates={holderMappingCandidates}
            members={holderMembers}
            onCancel={handleCancelHolderMapping}
            onConfirm={handleConfirmHolderMapping}
            placeholders={holderPlaceholders}
          />
        ) : null}

        {executionError ? <Alert severity="error">{executionError}</Alert> : null}

        {executionResult && executionStatus === "completed" ? (
          <DataImportExecutionStatus result={executionResult} />
        ) : null}
      </Stack>
    </SettingsPageLayout>
  );
}

function summaryText(result: Extract<ImportValidationResult, { ok: true }>, photoCount: number) {
  const { incomeExpenseCount, transferCount, balanceAdjustmentCount } = result.summary;
  return [
    incomeExpenseCount && resultMessages.incomeExpenseCountLabel(incomeExpenseCount),
    transferCount && resultMessages.transferCountLabel(transferCount),
    balanceAdjustmentCount && resultMessages.balanceAdjustmentCountLabel(balanceAdjustmentCount),
    photoCount && resultMessages.photoCountLabel(photoCount),
  ].filter(Boolean).join(" · ") || resultMessages.emptySummary;
}

function FormatGroup({ title, columns, hints }: {
  title: string;
  columns: ImportColumnDef[];
  hints: string[];
}) {
  return (
    <Stack spacing={1}>
      <Typography sx={{ fontWeight: 700 }} variant="body2">{title}</Typography>
      <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
        {columns.map((column) => (
          <Typography component="li" key={column.name} variant="body2">
            {column.name}{column.required ? "*" : ""}
          </Typography>
        ))}
      </Box>
      {hints.map((hint) => (
        <Typography key={hint} color="textSecondary" variant="body2">{hint}</Typography>
      ))}
    </Stack>
  );
}

function FormatDescriptionCard() {
  const m = formatMessages;
  return (
    <Accordion disableGutters>
      <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />}>
        <Typography>{m.title}</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Stack spacing={2}>
          <Typography variant="body2">{m.fileTypeHint}</Typography>
          <Typography variant="body2">{m.unknownColumnHint}</Typography>
          <FormatGroup title={m.incomeExpenseColumnsTitle}
            columns={[...importColumnsBySheetKind.incomeExpense, ...incomeExpensePhotoColumns]}
            hints={[m.holderColumnHint, m.accountTypeColumnHint, m.recorderColumnHint, m.billRefHint, m.splitPaymentHint, m.photoColumnHint]} />
          <FormatGroup title={m.transferColumnsTitle}
            columns={importColumnsBySheetKind.transfer}
            hints={[m.transferAmountHint]} />
          <FormatGroup title={m.balanceAdjustmentColumnsTitle}
            columns={importColumnsBySheetKind.balanceAdjustment}
            hints={[m.balanceAdjustmentHint]} />
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
}

function ValidationErrors({ result }: { result: Extract<ImportValidationResult, { ok: false }> }) {
  const issues = groupValidationIssues(result.issues);
  const limit = 20;
  return (
    <SectionCard>
      <Stack spacing={1.5}>
        <Alert severity="error">
          <Typography sx={{ fontWeight: 700 }}>{resultMessages.failureTitle(issues.length)}</Typography>
        </Alert>
        <DataImportIssueList issues={issues.slice(0, limit)} />
        {issues.length > limit ? (
          <Typography color="textSecondary" variant="body2">
            {resultMessages.moreIssues(issues.length - limit)}
          </Typography>
        ) : null}
      </Stack>
    </SectionCard>
  );
}
