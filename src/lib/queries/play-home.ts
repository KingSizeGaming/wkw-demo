import { and, asc, desc, eq, gt, sql } from "drizzle-orm";
import { db } from "@/db";
import { entries, links, matches, plusbPoints, users } from "@/db/schema";
import {
  getCurrentWeekId,
  incrementWeekId,
  isoWeekStartUtc,
  parseWeekId,
} from "@/lib/week";

export type PlayHomeResult =
  | { ok: false; status: 404; error: "user_not_found" }
  | {
      ok: true;
      weekId: string;
      pickStatus: "active" | "picked" | "not_available";
      picksAvailable: number;
      predictionToken: string | null;
      nextWeekStartDate: string | null;
      entryWeekId: string | null;
      // Token for the "view picks" link — the entry's own PREDICTION link, which
      // getEntryDetail accepts for auth even after it's been marked USED. Null when
      // the user has no entry for the current week.
      viewToken: string | null;
      plusbPoints: number;
      standing: { tag: string; rank: number | null; score: number | null };
    };

// Monday UTC (ISO date string) that starts the week after the given weekId.
function nextWeekStartIso(weekId: string): string | null {
  const next = parseWeekId(incrementWeekId(weekId));
  if (!next) return null;
  return isoWeekStartUtc(next.year, next.week).toISOString().slice(0, 10);
}

// Rank (1-based) + score for one leaderboardId within a week's global points ranking.
// Rank counts how many distinct leaderboardIds have strictly greater total points.
async function getStanding(
  leaderboardId: string,
  weekId: string
): Promise<{ rank: number | null; score: number | null }> {
  const totals = await db
    .select({
      leaderboardId: users.leaderboardId,
      points: sql<number>`coalesce(sum(${entries.points}), 0)::int`,
    })
    .from(entries)
    .innerJoin(users, eq(users.waNumber, entries.waNumber))
    .where(and(eq(entries.weekId, weekId), sql`${users.leaderboardId} is not null`))
    .groupBy(users.leaderboardId);

  const mine = totals.find((r) => r.leaderboardId === leaderboardId);
  if (!mine) return { rank: null, score: null };
  const rank = 1 + totals.filter((r) => r.points > mine.points).length;
  return { rank, score: mine.points };
}

export async function getPlayHome(leaderboardId: string): Promise<PlayHomeResult> {
  const userRows = await db
    .select({ waNumber: users.waNumber, leaderboardId: users.leaderboardId, saIdHash: users.saIdHash })
    .from(users)
    .where(eq(users.leaderboardId, leaderboardId))
    .limit(1);

  if (userRows.length === 0) {
    return { ok: false, status: 404, error: "user_not_found" };
  }
  const { waNumber, saIdHash } = userRows[0];

  const pointsRows = saIdHash
    ? await db
        .select({ balance: plusbPoints.balance })
        .from(plusbPoints)
        .where(eq(plusbPoints.saIdHash, saIdHash))
        .limit(1)
    : [];
  const plusbBalance = pointsRows[0]?.balance ?? 0;
  const weekId = getCurrentWeekId();
  const standing = await getStanding(leaderboardId, weekId);
  const base = {
    ok: true as const,
    weekId,
    plusbPoints: plusbBalance,
    standing: { tag: leaderboardId, rank: standing.rank, score: standing.score },
  };

  const matchCount = await db
    .select({ id: matches.id })
    .from(matches)
    .where(eq(matches.weekId, weekId));

  if (matchCount.length === 0) {
    return {
      ...base,
      pickStatus: "not_available",
      picksAvailable: 0,
      predictionToken: null,
      nextWeekStartDate: nextWeekStartIso(weekId),
      entryWeekId: null,
      viewToken: null,
    };
  }

  // Latest entry for this week (if any). Its linkToken authorizes the "view picks"
  // link. With PlusB conversions a user can submit one entry and still hold more
  // valid links, so an entry and remaining picks coexist in the single active state.
  const existingEntry = await db
    .select({ linkToken: entries.linkToken })
    .from(entries)
    .where(and(eq(entries.waNumber, waNumber), eq(entries.weekId, weekId)))
    .orderBy(desc(entries.submittedAt))
    .limit(1);

  const validLinks = await db
    .select({ token: links.token })
    .from(links)
    .where(
      and(
        eq(links.waNumber, waNumber),
        eq(links.type, "PREDICTION"),
        eq(links.weekId, weekId),
        eq(links.status, "VALID"),
        gt(links.expiresAt, new Date())
      )
    )
    .orderBy(asc(links.createdAt));

  return {
    ...base,
    pickStatus: "active",
    picksAvailable: validLinks.length,
    predictionToken: validLinks[0]?.token ?? null,
    nextWeekStartDate: null,
    entryWeekId: existingEntry.length > 0 ? weekId : null,
    viewToken: existingEntry[0]?.linkToken ?? null,
  };
}
