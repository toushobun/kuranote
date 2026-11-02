import NewReceipt from "./receipt";
import { Probe } from "../probe";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ empty?: string }>;
}) {
  const params = await searchParams;
  return (
    <Probe>
      <NewReceipt empty={params.empty === "1"} />
    </Probe>
  );
}
