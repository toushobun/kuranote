import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { dataImportResultMessages as messages } from "config/dataImportExportMessages";
import { importSheetKindLabels } from "internal/dataImport";
import type { GroupedImportIssue } from "utils/groupDataImportIssues";

export function DataImportIssueList({
  issues,
}: {
  issues: GroupedImportIssue[];
}) {
  const sections = new Map<string, GroupedImportIssue[]>();
  for (const issue of issues) {
    const title = issue.rows.length && issue.sheet
      ? importSheetKindLabels[issue.sheet]
      : messages.structuralTitle;
    const section = sections.get(title) ?? [];
    section.push(issue);
    sections.set(title, section);
  }
  return (
    <Stack spacing={1}>
      {[...sections].map(([title, items]) => (
        <Stack key={title} spacing={0.5}>
          <Typography variant="body2" sx={{ fontWeight: 700 }}>
            {title}
          </Typography>
          {items.map((issue, index) => (
            <Typography key={index} variant="body2">
              {issue.rows.length
                ? messages.rowIssue(issue.rows, issue.reason, issue.column)
                : issue.reason}
            </Typography>
          ))}
        </Stack>
      ))}
    </Stack>
  );
}
