"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import { dataImportHolderMappingMessages as messages } from "config/dataImportExportMessages";
import type { AccountImportHolder } from "internal/account";
import type {
  ImportHolderMapping,
  ImportHolderMappingCandidate,
} from "internal/dataImport";
import { SectionCard } from "molecules/ui/SectionCard";
import { designTokens } from "theme/theme";
import {
  getMemberOptionLabel,
  noHolderOptionValue,
  useDataImportHolderMapping,
} from "./useDataImportHolderMapping";

type DataImportHolderMappingProps = {
  candidates: ImportHolderMappingCandidate[];
  disabled?: boolean;
  members: AccountImportHolder[];
  onCancel: () => void;
  onConfirm: (mapping: ImportHolderMapping) => void;
};

export function DataImportHolderMapping({
  candidates,
  disabled = false,
  members,
  onCancel,
  onConfirm,
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
                <MenuItem value={noHolderOptionValue}>
                  {messages.noHolderOption}
                </MenuItem>
                {members.map((member) => (
                  <MenuItem key={member.userId} value={member.userId}>
                    {getMemberOptionLabel(member, members)}
                  </MenuItem>
                ))}
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
