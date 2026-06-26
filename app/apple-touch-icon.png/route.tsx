import { createKuraIconImageResponse } from "../icons/kuraIconImage";

export const runtime = "edge";

export function GET() {
  return createKuraIconImageResponse({
    borderRadius: 40,
    fontSize: 90,
    markSize: 136,
    size: 180,
  });
}
