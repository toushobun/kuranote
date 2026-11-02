import { StandardEditor, NewTransferEditor } from "../../additional-editors";
import NewReceipt from "../../new/receipt";
import { Probe } from "../../probe";
export const dynamic = "force-dynamic";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ method?: string; type?: string }>;
}) {
  const { method, type } = await searchParams;
  return (
    <Probe>
      {method === "transfer" ? (
        <NewTransferEditor />
      ) : method === "standard" ? (
        <StandardEditor income={type === "income"} />
      ) : (
        <NewReceipt empty={false} />
      )}
    </Probe>
  );
}
