import { Probe } from "../probe";
import { MerchantEditor } from "../merchant-editor";
export const dynamic = "force-dynamic";
export default function Page() {
  return (
    <Probe>
      <MerchantEditor edit={true} />
    </Probe>
  );
}
