import type { NextRequest } from "next/server";
import { handleLabs } from "@/lib/labs/server";
export const runtime = "nodejs";
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ product: string }> },
) {
  return handleLabs(req, (await context.params).product, false);
}
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ product: string }> },
) {
  return handleLabs(req, (await context.params).product, false);
}
