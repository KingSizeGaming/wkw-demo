import { NextRequest, NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { plusbCredits, plusbPoints } from "@/db/schema";
import { hashSaId } from "@/lib/sa-id-server";
import { parseSaIdBirthDate } from "@/lib/sa-id";

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

  const result = await db.transaction(async (tx) => {
    const inserted = await tx
      .insert(plusbCredits)
      .values({ transactionId, saIdHash, amount })
      .onConflictDoNothing({ target: plusbCredits.transactionId })
      .returning({ id: plusbCredits.id });

    if (inserted.length === 0) {
      // Duplicate transactionId — idempotent no-op; return current balance.
      const rows = await tx
        .select({ balance: plusbPoints.balance })
        .from(plusbPoints)
        .where(eq(plusbPoints.saIdHash, saIdHash))
        .limit(1);
      return { balance: rows[0]?.balance ?? 0, duplicate: true };
    }

    const upserted = await tx
      .insert(plusbPoints)
      .values({ saIdHash, balance: amount })
      .onConflictDoUpdate({
        target: plusbPoints.saIdHash,
        set: { balance: sql`${plusbPoints.balance} + ${amount}`, updatedAt: new Date() },
      })
      .returning({ balance: plusbPoints.balance });

    return { balance: upserted[0].balance, duplicate: false };
  });

  return NextResponse.json({ ok: true, duplicate: result.duplicate, balance: result.balance });
}
