import { NextRequest, NextResponse } from "next/server";
import { and, eq, gt, sql } from "drizzle-orm";
import { db } from "@/db";
import { links, plusbPoints, users } from "@/db/schema";
import { generateToken } from "@/lib/tokens";
import { getCurrentWeekId, getIsoWeekEndUtc } from "@/lib/week";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const leaderboardId = String(body?.leaderboardId ?? "").trim();
  const amount = body?.amount;

  if (!leaderboardId) {
    return NextResponse.json({ error: "user_not_found" }, { status: 404 });
  }
  if (typeof amount !== "number" || !Number.isInteger(amount) || amount < 1) {
    return NextResponse.json({ error: "invalid_amount" }, { status: 400 });
  }
  if (amount > 5) {
    return NextResponse.json({ error: "max_exceeded" }, { status: 400 });
  }

  const userRows = await db
    .select({ waNumber: users.waNumber, saIdHash: users.saIdHash })
    .from(users)
    .where(eq(users.leaderboardId, leaderboardId))
    .limit(1);
  if (userRows.length === 0 || !userRows[0].saIdHash) {
    return NextResponse.json({ error: "user_not_found" }, { status: 404 });
  }
  const { waNumber, saIdHash } = userRows[0];
  const weekId = getCurrentWeekId();

  const result = await db.transaction(async (tx) => {
    // Optimistic debit — only succeeds if the balance covers the amount.
    const debited = await tx
      .update(plusbPoints)
      .set({ balance: sql`${plusbPoints.balance} - ${amount}`, updatedAt: new Date() })
      .where(and(eq(plusbPoints.saIdHash, saIdHash), sql`${plusbPoints.balance} >= ${amount}`))
      .returning({ balance: plusbPoints.balance });

    if (debited.length === 0) return null;

    const expiresAt = getIsoWeekEndUtc(new Date());
    await tx.insert(links).values(
      Array.from({ length: amount }, () => ({
        token: generateToken("pred"),
        type: "PREDICTION" as const,
        waNumber,
        weekId,
        status: "VALID" as const,
        expiresAt,
      }))
    );
    return { balance: debited[0].balance };
  });

  if (!result) {
    return NextResponse.json({ error: "insufficient_points" }, { status: 400 });
  }

  const validLinks = await db
    .select({ id: links.id })
    .from(links)
    .where(
      and(
        eq(links.waNumber, waNumber),
        eq(links.type, "PREDICTION"),
        eq(links.weekId, weekId),
        eq(links.status, "VALID"),
        gt(links.expiresAt, new Date())
      )
    );

  return NextResponse.json({ picksAvailable: validLinks.length, balance: result.balance });
}
