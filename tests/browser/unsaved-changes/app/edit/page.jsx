import Editor from "./editor";
import { save } from "../actions";

export const dynamic = "force-dynamic";

export default function Page() {
  return <Editor save={save} />;
}
