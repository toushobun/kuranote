import { createKuraIconImageResponse } from "../kuraIconImage";

export const runtime = "edge";

export function GET() {
  return createKuraIconImageResponse({
    borderRadius: 112,
    fontSize: 256,
    markSize: 384,
    size: 512,
  });
}
