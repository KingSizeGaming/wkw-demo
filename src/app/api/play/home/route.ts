import { NextRequest, NextResponse } from "next/server";
import { getPlayHome } from "@/lib/queries/play-home";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const leaderboardId = searchParams.get("leaderboardId")?.trim();

  if (!leaderboardId) {
    return NextResponse.json({ error: "missing_leaderboard_id" }, { status: 400 });
  }

  const result = await getPlayHome(leaderboardId);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({
    weekId: result.weekId,
    pickStatus: result.pickStatus,
    picksAvailable: result.picksAvailable,
    predictionToken: result.predictionToken,
    nextWeekStartDate: result.nextWeekStartDate,
    entryWeekId: result.entryWeekId,
    standing: result.standing,
  });
}
