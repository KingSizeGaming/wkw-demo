import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { hashSaId } from "@/lib/sa-id-server";
import { parseSaIdBirthDate } from "@/lib/sa-id";
import { creditPlusbPoints } from "@/lib/plusb";

// Demo SA ID used by the web /play flow (matches MOCK_SA_ID in PlayPage).
// Defaulting to it lets the admin top up the demo web account in one click.
const DEMO_SA_ID = "9001015009089";

// POST /api/admin/plusb — demo-only PlusB top-up. Unlike the external
// /api/plusb/points webhook, this requires no bearer token (admin is POC mode)
// and generates its own transactionId so each click adds points.
//
// Target account: by `leaderboardId` if provided (validated against the users
// table), otherwise the fixed demo SA ID.
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const amount = Number(body?.amount);
  const leaderboardId = String(body?.leaderboardId ?? "").trim().toUpperCase();

  if (!Number.isInteger(amount) || amount < 1) {
    return NextResponse.json({ ok: false, error: "invalid_amount" }, { status: 400 });
  }

  let saIdHash: string | null;
  if (leaderboardId) {
    const rows = await db
      .select({ saIdHash: users.saIdHash })
      .from(users)
      .where(eq(users.leaderboardId, leaderboardId))
      .limit(1);
    if (rows.length === 0) {
      return NextResponse.json({ ok: false, error: "leaderboard_not_found" }, { status: 404 });
    }
    saIdHash = rows[0].saIdHash;
    if (!saIdHash) {
      // User exists but has no SA ID on record, so points can't be keyed to them.
      return NextResponse.json({ ok: false, error: "account_has_no_sa_id" }, { status: 400 });
    }
  } else {
    if (!parseSaIdBirthDate(DEMO_SA_ID)) {
      return NextResponse.json({ ok: false, error: "invalid_request" }, { status: 400 });
    }
    saIdHash = hashSaId(DEMO_SA_ID);
  }

  if (!saIdHash) {
    return NextResponse.json({ ok: false, error: "server_misconfigured" }, { status: 500 });
  }

  const result = await creditPlusbPoints({
    saIdHash,
    transactionId: `admin-${randomUUID()}`,
    amount,
  });

  return NextResponse.json({
    ok: true,
    target: leaderboardId || DEMO_SA_ID,
    leaderboardId: leaderboardId || null,
    amount,
    balance: result.balance,
  });
}
