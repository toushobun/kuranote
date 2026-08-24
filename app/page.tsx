import { redirect } from "next/navigation";

import { routePaths } from "config/paths";

export default function RootPage() {
  redirect(routePaths.dashboard);
}
