import Typography from "@mui/material/Typography";

import { SectionCard } from "molecules/ui/SectionCard";
import { formatNumber } from "utils/transactions";

type PeriodExpenseCardProps = {
  expense: string;
  label: string;
  recordCount: number;
};

export function PeriodExpenseCard({
  expense,
  label,
  recordCount,
}: PeriodExpenseCardProps) {
  return (
    <SectionCard
      sx={{
        borderRadius: 1,
        flex: 1,
        p: 1.8,
      }}
    >
      <Typography sx={{ color: "text.secondary", fontSize: 12, mb: 0.6 }}>
        {label}
      </Typography>
      <Typography
        sx={{
          color: "var(--user-theme-negative-amount)",
          fontSize: 20,
          fontWeight: 900,
          lineHeight: 1.2,
        }}
      >
        -{formatNumber(expense)}
      </Typography>
      {recordCount > 0 ? (
        <Typography sx={{ color: "text.secondary", fontSize: 11, mt: 0.4 }}>
          共 {recordCount} 笔记录
        </Typography>
      ) : null}
    </SectionCard>
  );
}
