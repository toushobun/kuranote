import { CategoryEditor } from "../additional-editors";
import { Probe } from "../probe";
export const dynamic = "force-dynamic";
export default function Page() {
  return (
    <Probe>
      <CategoryEditor />
    </Probe>
  );
}
