import { dataExportPageMessages } from "config/dataImportExportMessages";

export function buildDataExportFileName(ledgerName: string, now = new Date()) {
  const pad = (value: number) => String(value).padStart(2, "0");
  const date = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
  const time = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const name = ledgerName
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "_")
    .replace(/[. ]+$/g, "");
  return `KuraNote-${name || dataExportPageMessages.fallbackLedgerName}-${date}-${time}.xlsx`;
}
