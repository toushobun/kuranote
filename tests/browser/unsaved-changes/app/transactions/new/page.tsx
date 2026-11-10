import { NewTransferEditor } from "../../additional-editors";
import NewReceipt from "../../new/receipt";
import { Probe } from "../../probe";
export const dynamic = "force-dynamic";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ method?: string }>;
}) {
  const { method } = await searchParams;
  return (
    <Probe>
      {method === "transfer" ? (
        <NewTransferEditor />
      ) : (
        <NewReceipt empty={false} />
      )}
    </Probe>
  );
}
