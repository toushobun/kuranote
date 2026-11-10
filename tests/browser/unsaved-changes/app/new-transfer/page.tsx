import NewReceipt from "../new/receipt";
import { Probe } from "../probe";
export const dynamic = "force-dynamic";
export default function Page() {
  return (
    <Probe>
      <NewReceipt empty={false} initialMethod="transfer" />
    </Probe>
  );
}
