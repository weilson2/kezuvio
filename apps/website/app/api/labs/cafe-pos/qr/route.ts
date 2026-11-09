import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";
import { loadLocalEnvironment } from "../../../../../../../packages/database/environment";
export const runtime = "nodejs";
export async function GET(req: NextRequest) {
  const table = req.nextUrl.searchParams.get("table");
  if (!table || !/^[1-6]$/.test(table))
    return NextResponse.json(
      { error: "Choose a table from 1 to 6." },
      { status: 400 },
    );
  loadLocalEnvironment("dev", false);
  // Configured origin only. Do not encode arbitrary Host headers or session secrets.
  const origin = new URL(process.env.LABS_ORIGIN || "http://127.0.0.1:3000");
  if (!["http:", "https:"].includes(origin.protocol))
    return NextResponse.json(
      { error: "Demo origin is unavailable." },
      { status: 503 },
    );
  const url = new URL(`/demo/cafe-pos?table=${table}`, origin.origin).href;
  const svg = await QRCode.toString(url, {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: 4,
    width: 200,
  });
  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "private, max-age=300",
      "X-Robots-Tag": "noindex, nofollow",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
