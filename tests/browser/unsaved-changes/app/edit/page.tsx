import { Probe } from "../probe";
import Editor from "./editor";
import { save } from "../actions";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Probe>
      <Editor save={save} />
    </Probe>
  );
}
