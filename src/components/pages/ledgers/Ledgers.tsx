import { loadLedgersView } from "server/loaders/ledgers";
import { LedgersTemplate } from "templates/ledgers/Ledgers";

export async function LedgersPage() {
  const view = await loadLedgersView();

  return <LedgersTemplate {...view} />;
}
