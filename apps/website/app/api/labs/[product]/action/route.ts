import type { NextRequest } from "next/server";
import { handleLabs } from "@/lib/labs/server";
export const runtime = "nodejs";
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ product: string }> },
) {
  return handleLabs(req, (await context.params).product, true);
}
