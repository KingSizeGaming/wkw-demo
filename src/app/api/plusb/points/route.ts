import { NextRequest, NextResponse } from "next/server";
import { hashSaId } from "@/lib/sa-id-server";
import { parseSaIdBirthDate } from "@/lib/sa-id";
import { creditPlusbPoints } from "@/lib/plusb";

export async function POST(request: NextRequest) {
  const expected = process.env.PLUSB_API_TOKEN
    ?? (process.env.NODE_ENV === "development" ? "dev" : null);
  if (!expected) {
    return NextResponse.json({ error: "server_misconfigured" }, { status: 500 });
  }
  const auth = request.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!token || token !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const saId = String(body?.saId ?? "").trim();
  const transactionId = String(body?.transactionId ?? "").trim();
  const amount = body?.amount;

  if (
    !saId ||
    !transactionId ||
    typeof amount !== "number" ||
    !Number.isInteger(amount) ||
    amount < 1 ||
    !parseSaIdBirthDate(saId)
  ) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const saIdHash = hashSaId(saId);
  if (!saIdHash) {
    return NextResponse.json({ error: "server_misconfigured" }, { status: 500 });
  }

  const result = await creditPlusbPoints({ saIdHash, transactionId, amount });

  return NextResponse.json({ ok: true, duplicate: result.duplicate, balance: result.balance });
}
