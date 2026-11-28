import type {
  ImportExecutionDetail,
  ImportValidationIssue,
} from "internal/dataImport";

type Sheet = ImportExecutionDetail["sheet"];

export type GroupedImportIssue = {
  sheet?: Sheet;
  column?: string;
  reason: string;
  rows: number[];
};

function groupRows(items: GroupedImportIssue[]) {
  const groups: GroupedImportIssue[] = [];
  const byKey = new Map<string, GroupedImportIssue>();
  for (const item of items) {
    if (!item.rows.length) {
      groups.push(item);
      continue;
    }
    const key = JSON.stringify([item.sheet, item.column, item.reason]);
    const existing = byKey.get(key);
    if (existing) {
      existing.rows.push(...item.rows);
    } else {
      const group = { ...item, rows: [...item.rows] };
      byKey.set(key, group);
      groups.push(group);
    }
  }
  return groups.map((group) => ({
    ...group,
    rows: [...new Set(group.rows)].sort((left, right) => left - right),
  }));
}

export function groupValidationIssues(issues: ImportValidationIssue[]) {
  return groupRows(
    issues.map((issue) => ({
      sheet: issue.sheet,
      reason: issue.message,
      ...(issue.kind === "row"
        ? { column: issue.column, rows: [issue.rowNumber] }
        : { rows: [] }),
    })),
  );
}

export function groupExecutionIssues(details: ImportExecutionDetail[]) {
  return groupRows(
    details.map(({ sheet, reason, rowNumbers }) => ({
      sheet,
      reason,
      rows: rowNumbers,
    })),
  );
}
