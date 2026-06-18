import { NextRequest, NextResponse } from "next/server";
import { and, eq, gt, sql } from "drizzle-orm";
import { db } from "@/db";
import { links, users, vouchers } from "@/db/schema";
import { generateToken } from "@/lib/tokens";
import { getCurrentWeekId, getIsoWeekEndUtc } from "@/lib/week";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const voucherCode = String(body?.voucherCode ?? "").trim().toUpperCase();
  const leaderboardId = String(body?.leaderboardId ?? "").trim();

  if (!voucherCode || !leaderboardId) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  const userRows = await db
    .select({ waNumber: users.waNumber })
    .from(users)
    .where(eq(users.leaderboardId, leaderboardId))
    .limit(1);
  if (userRows.length === 0) {
    return NextResponse.json({ error: "user_not_found" }, { status: 404 });
  }
  const { waNumber } = userRows[0];
  const weekId = getCurrentWeekId();

  const voucherRows = await db
    .select({ id: vouchers.id, weekId: vouchers.weekId, isUsed: vouchers.isUsed })
    .from(vouchers)
    .where(sql`upper(${vouchers.voucherToken}) = ${voucherCode}`)
    .limit(1);

  if (voucherRows.length === 0) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
  const voucher = voucherRows[0];
  if (voucher.isUsed) {
    return NextResponse.json({ error: "already_used" }, { status: 400 });
  }
  if (voucher.weekId !== weekId) {
    return NextResponse.json({ error: "wrong_week" }, { status: 400 });
  }

  const predictionToken = generateToken("pred");

  const redeemed = await db.transaction(async (tx) => {
    const updated = await tx
      .update(vouchers)
      .set({ isUsed: true, usedByWaNumber: waNumber, usedAt: new Date() })
      .where(and(eq(vouchers.id, voucher.id), eq(vouchers.isUsed, false)))
      .returning({ id: vouchers.id });

    if (updated.length === 0) return false; // lost the race

    await tx.insert(links).values({
      token: predictionToken,
      type: "PREDICTION",
      waNumber,
      weekId,
      status: "VALID",
      expiresAt: getIsoWeekEndUtc(new Date()),
    });
    return true;
  });

  if (!redeemed) {
    return NextResponse.json({ error: "already_used" }, { status: 400 });
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

  return NextResponse.json({ picksAvailable: validLinks.length, predictionToken });
}
