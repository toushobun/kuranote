"use client";

import FormControl from "@mui/material/FormControl";
import FormLabel from "@mui/material/FormLabel";
import FormControlLabel from "@mui/material/FormControlLabel";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import {
  ledgerSetupRegions,
  isLedgerSetupRegion,
  type LedgerSetupRegion,
} from "internal/ledger";
import { regionPresetMessages as messages } from "config/regionPresetMessages";
import { useId } from "react";

export function LedgerRegionField({
  value,
  onChange,
  disabled = false,
}: {
  value: LedgerSetupRegion | null;
  onChange: (region: LedgerSetupRegion) => void;
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <FormControl disabled={disabled} required>
      <FormLabel id={id}>{messages.label}</FormLabel>
      <RadioGroup
        row
        aria-labelledby={id}
        name="livingRegion"
        value={value ?? ""}
        onChange={(_, region) => {
          if (isLedgerSetupRegion(region)) onChange(region);
        }}
      >
        {ledgerSetupRegions.map((region) => (
          <FormControlLabel
            key={region}
            value={region}
            control={<Radio required />}
            label={messages.names[region]}
          />
        ))}
      </RadioGroup>
    </FormControl>
  );
}
