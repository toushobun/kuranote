import { getLedgerContextForApi } from "lib/ledger/api-context";
import {
  archiveMerchantService,
  updateMerchantService,
} from "server/services/merchants";
import { isUuid } from "utils/formData";

type RouteContext = { params: Promise<{ id: string }> };

function parseWebsiteUrl(value: unknown): string | null | undefined {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string") return undefined;
  try {
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol) || !url.hostname)
      return undefined;
    return value;
  } catch {
    return undefined;
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const ctx = await getLedgerContextForApi();
  if (!ctx.ok) {
    return Response.json({ error: ctx.message }, { status: ctx.status });
  }

  const { id: merchantId } = await params;
  if (!isUuid(merchantId)) {
    return Response.json({ error: "merchant_invalid" }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return Response.json({ error: "请求体格式错误" }, { status: 400 });
  }

  const { name, websiteUrl, note } = body;

  if (typeof name !== "string" || name.trim().length === 0) {
    return Response.json({ error: "name_required" }, { status: 400 });
  }
  if (name.trim().length > 100) {
    return Response.json({ error: "name_too_long" }, { status: 400 });
  }

  const parsedUrl = parseWebsiteUrl(websiteUrl);
  if (parsedUrl === undefined) {
    return Response.json({ error: "website_url_invalid" }, { status: 400 });
  }

  const noteStr =
    note === undefined || note === null ? null : String(note);
  if (noteStr !== null && noteStr.length > 1000) {
    return Response.json({ error: "note_too_long" }, { status: 400 });
  }

  const result = await updateMerchantService({
    ledgerId: ctx.currentLedger.id,
    merchantId,
    name: name.trim(),
    note: noteStr,
    userId: ctx.userId,
    websiteUrl: parsedUrl,
  });

  if (!result.ok) {
    return Response.json({ error: result.error }, { status: 400 });
  }

  return Response.json({ success: true });
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const ctx = await getLedgerContextForApi();
  if (!ctx.ok) {
    return Response.json({ error: ctx.message }, { status: ctx.status });
  }

  const { id: merchantId } = await params;
  if (!isUuid(merchantId)) {
    return Response.json({ error: "merchant_invalid" }, { status: 400 });
  }

  const result = await archiveMerchantService({
    ledgerId: ctx.currentLedger.id,
    merchantId,
    userId: ctx.userId,
  });

  if (!result.ok) {
    return Response.json({ error: result.error }, { status: 400 });
  }

  return Response.json({ success: true });
}
