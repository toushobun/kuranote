import { Probe } from "../probe";
import Receipt from "./receipt";
import { save, saveReceipt } from "../actions";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Probe>
      <Receipt save={saveReceipt} remove={save} />
    </Probe>
  );
}
