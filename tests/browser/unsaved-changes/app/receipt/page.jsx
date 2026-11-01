import Receipt from "./receipt";
import { save } from "../actions";

export const dynamic = "force-dynamic";

export default function Page() {
  return <Receipt save={save} />;
}
