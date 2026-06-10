import Typography from "@mui/material/Typography";

import { SectionCard } from "molecules/ui/SectionCard";
import { PageHeader } from "templates/layout/PageHeader";
import { PageShell } from "templates/layout/PageShell";

type StatisticsTemplateProps = {
  ledgerName: string;
};

export function StatisticsTemplate({ ledgerName }: StatisticsTemplateProps) {
  return (
    <PageShell>
      <PageHeader title="统计" subtitle={`当前账本：${ledgerName}`} />

      <SectionCard>
        <Typography color="text.secondary">
          收支统计将在后续 Issue 中实现。
        </Typography>
      </SectionCard>
    </PageShell>
  );
}
