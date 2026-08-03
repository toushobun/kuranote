import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Collapse from "@mui/material/Collapse";
import FormControlLabel from "@mui/material/FormControlLabel";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useState } from "react";

import type { TransactionReimbursementCandidate } from "types/transactions";
import { getCurrencySymbol } from "utils/currency";
import { formatNumber } from "utils/transactions";

type TransactionReimbursementLinkPickerProps = {
  candidates: TransactionReimbursementCandidate[];
  onChange: (ids: string[]) => void;
  selectedIds: string[];
};

export function TransactionReimbursementLinkPicker({
  candidates,
  onChange,
  selectedIds,
}: TransactionReimbursementLinkPickerProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Stack component="section" spacing={0.75} sx={containerSx}>
      <Button
        aria-expanded={expanded}
        endIcon={
          <ExpandMoreRoundedIcon
            sx={{ transform: expanded ? "rotate(180deg)" : "none" }}
          />
        }
        onClick={() => setExpanded((value) => !value)}
        sx={headerButtonSx}
      >
        报销关联
        {selectedIds.length > 0 ? `（已选 ${selectedIds.length} 条）` : ""}
      </Button>
      <Typography color="text.secondary" variant="caption">
        选择由这笔收入结清的待报销明细，可一次关联多条。
      </Typography>
      <Collapse in={expanded}>
        {candidates.length === 0 ? (
          <Typography color="text.secondary" sx={emptySx} variant="body2">
            当前账本没有待报销明细。
          </Typography>
        ) : (
          <Stack spacing={0.25}>
            {candidates.map((candidate) => {
              const checked = selectedIds.includes(candidate.id);
              return (
                <FormControlLabel
                  control={<Checkbox checked={checked} />}
                  key={candidate.id}
                  label={
                    <Stack>
                      <Typography sx={{ fontWeight: 800 }} variant="body2">
                        {candidate.categoryName} ·{" "}
                        {getCurrencySymbol(candidate.accountCurrency)}
                        {formatNumber(candidate.amount)}
                      </Typography>
                      <Typography color="text.secondary" variant="caption">
                        {new Date(candidate.transactionAt).toLocaleDateString()}
                      </Typography>
                    </Stack>
                  }
                  onChange={() =>
                    onChange(
                      checked
                        ? selectedIds.filter((id) => id !== candidate.id)
                        : [...selectedIds, candidate.id],
                    )
                  }
                  sx={optionSx}
                />
              );
            })}
          </Stack>
        )}
      </Collapse>
    </Stack>
  );
}

const containerSx = { borderTop: 1, borderColor: "divider", mt: 1.5, pt: 1.25 };
const headerButtonSx = {
  justifyContent: "space-between",
  px: 0,
  fontWeight: 900,
};
const emptySx = { py: 1.5, textAlign: "center" };
const optionSx = {
  borderRadius: 1.5,
  m: 0,
  px: 0.5,
  "&:has(.Mui-checked)": {
    bgcolor: "var(--user-theme-field-card-selected-bg)",
  },
};
