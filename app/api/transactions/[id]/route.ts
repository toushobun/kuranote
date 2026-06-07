import { getLedgerContextForApi } from "lib/ledger/api-context";
import { voidTransactionService } from "server/services/transactions";
import { isUuid } from "utils/formData";

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, { params }: RouteContext) {
  const ctx = await getLedgerContextForApi();
  if (!ctx.ok) {
    return Response.json({ error: ctx.message }, { status: ctx.status });
  }

  const { id: transactionRecordId } = await params;
  if (!isUuid(transactionRecordId)) {
    return Response.json({ error: "void_invalid" }, { status: 400 });
  }

  const result = await voidTransactionService({
    ledgerId: ctx.currentLedger.id,
    transactionRecordId,
  });

  if (!result.ok) {
    return Response.json({ error: result.error }, { status: 400 });
  }

  return Response.json({ success: true });
}
