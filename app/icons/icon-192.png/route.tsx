import { createKuraIconImageResponse } from "../kuraIconImage";

export const runtime = "edge";

export function GET() {
  return createKuraIconImageResponse({
    borderRadius: 42,
    fontSize: 96,
    markSize: 144,
    size: 192,
  });
}
