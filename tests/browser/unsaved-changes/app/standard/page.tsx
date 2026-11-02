import { StandardEditor } from "../additional-editors";
import { Probe } from "../probe";
export const dynamic = "force-dynamic";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;
  return (
    <Probe>
      <StandardEditor income={type === "income"} />
    </Probe>
  );
}
