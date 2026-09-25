"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ListSubheader from "@mui/material/ListSubheader";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import { dataImportHolderMappingMessages as messages } from "config/dataImportExportMessages";
import { placeholderMemberText } from "config/placeholderMemberText";
import type { AccountImportHolder } from "internal/account";
import type {
  ImportHolderMapping,
  ImportHolderMappingCandidate,
} from "internal/dataImport";
import type { LedgerPlaceholderMemberSummary } from "internal/ledger";
import { SectionCard } from "molecules/ui/SectionCard";
import { designTokens } from "theme/theme";
import {
  canCreatePlaceholderFor,
  getMemberOptionLabel,
  memberOptionValue,
  newPlaceholderOptionValue,
  noHolderOptionValue,
  placeholderOptionValue,
  sortPlaceholdersForName,
  useDataImportHolderMapping,
} from "./useDataImportHolderMapping";

type DataImportHolderMappingProps = {
  /** 当前用户是否为 owner/admin；只有这时才提供「新建待邀请成员」。 */
  canCreatePlaceholders?: boolean;
  candidates: ImportHolderMappingCandidate[];
  disabled?: boolean;
  members: AccountImportHolder[];
  onCancel: () => void;
  onConfirm: (mapping: ImportHolderMapping) => void;
  /** 当前账本未认领的待邀请成员，按 ID 选择、显示实时名字。 */
  placeholders?: LedgerPlaceholderMemberSummary[];
};

export function DataImportHolderMapping({
  canCreatePlaceholders = false,
  candidates,
  disabled = false,
  members,
  onCancel,
  onConfirm,
  placeholders = [],
}: DataImportHolderMappingProps) {
  const { getSelectedValue, handleConfirm, handleSelectChange } =
    useDataImportHolderMapping({
      names: candidates.map(({ name }) => name),
      onConfirm,
    });

  return (
    <SectionCard>
      <Stack spacing={2}>
        <Box>
          <Typography sx={{ fontWeight: 700 }}>
            {messages.title(candidates.length)}
          </Typography>
          <Typography sx={{ color: "text.secondary", mt: 0.5 }} variant="body2">
            {messages.description}
          </Typography>
          {canCreatePlaceholders ? (
            <Typography
              sx={{ color: "text.secondary", mt: 0.5 }}
              variant="body2"
            >
              {messages.newPlaceholderDescription}
            </Typography>
          ) : null}
        </Box>

        <Stack spacing={1.5}>
          {candidates.map((candidate) => (
            <Stack
              aria-label={messages.cardTitle(candidate.name)}
              key={candidate.name}
              role="group"
              spacing={1.5}
              sx={{
                border: 1,
                borderColor: "divider",
                borderRadius: `${designTokens.radius.item}px`,
                p: 1.5,
              }}
            >
              <Box>
                <Typography sx={{ fontWeight: 700 }}>
                  {messages.cardTitle(candidate.name)}
                </Typography>
                <Typography sx={{ color: "text.secondary" }} variant="body2">
                  {messages.recordCount(candidate.recordCount)}
                  {candidate.reason === "ambiguous"
                    ? `，${messages.ambiguousHint}`
                    : ""}
                </Typography>
              </Box>
              <TextField
                disabled={disabled}
                fullWidth
                label={messages.selectLabel}
                onChange={(event) =>
                  handleSelectChange(candidate.name, event.target.value)
                }
                select
                size="small"
                value={getSelectedValue(candidate.name)}
              >
                {renderHolderOptions({
                  canCreatePlaceholder: canCreatePlaceholderFor(candidate, {
                    canCreatePlaceholders,
                    placeholders,
                  }),
                  members,
                  name: candidate.name,
                  placeholders,
                })}
              </TextField>
            </Stack>
          ))}
        </Stack>

        <Stack direction="row" spacing={1.5}>
          <Button
            disabled={disabled}
            fullWidth
            onClick={onCancel}
            variant="outlined"
          >
            {messages.cancelButton}
          </Button>
          <Button
            disabled={disabled}
            fullWidth
            onClick={handleConfirm}
            variant="contained"
          >
            {messages.confirmButton}
          </Button>
        </Stack>
      </Stack>
    </SectionCard>
  );
}

/**
 * MUI Select 只识别直接子元素，分组标题与选项需要平铺成数组，不能用 Fragment 包裹。
 * 顺序：无持有人 → 成员 → 待邀请成员（新建选项在前，同名待邀请成员其次）。
 */
function renderHolderOptions({
  canCreatePlaceholder,
  members,
  name,
  placeholders,
}: {
  canCreatePlaceholder: boolean;
  members: AccountImportHolder[];
  name: string;
  placeholders: LedgerPlaceholderMemberSummary[];
}) {
  const options = [
    <MenuItem key={noHolderOptionValue} value={noHolderOptionValue}>
      {messages.noHolderOption}
    </MenuItem>,
  ];

  if (members.length > 0) {
    options.push(
      <ListSubheader key="member-group">
        {messages.memberGroupLabel}
      </ListSubheader>,
      ...members.map((member) => (
        <MenuItem key={member.userId} value={memberOptionValue(member.userId)}>
          {getMemberOptionLabel(member, members)}
        </MenuItem>
      )),
    );
  }

  if (canCreatePlaceholder || placeholders.length > 0) {
    options.push(
      <ListSubheader key="placeholder-group">
        {placeholderMemberText.accountHolderGroupLabel}
      </ListSubheader>,
    );
  }
  if (canCreatePlaceholder) {
    options.push(
      <MenuItem
        key={newPlaceholderOptionValue}
        value={newPlaceholderOptionValue}
      >
        {messages.newPlaceholderOption(name)}
      </MenuItem>,
    );
  }
  options.push(
    ...sortPlaceholdersForName(placeholders, name).map((placeholder) => (
      <MenuItem
        key={placeholder.id}
        value={placeholderOptionValue(placeholder.id)}
      >
        {placeholderMemberText.accountHolderOptionLabel(
          placeholder.displayName,
        )}
      </MenuItem>
    )),
  );

  return options;
}
