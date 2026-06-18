import { NextRequest, NextResponse } from 'next/server';
import { eq, and, desc } from 'drizzle-orm';
import { db } from '@/db';
import { users, links } from '@/db/schema';
import { hashSaId } from '@/lib/sa-id-server';
import { getCurrentWeekId } from '@/lib/week';

export async function GET(request: NextRequest) {
  const saId = request.nextUrl.searchParams.get('saId') ?? '';
  if (!saId) {
    return NextResponse.json({ error: 'Missing saId' }, { status: 400 });
  }

  const saIdHash = hashSaId(saId);
  if (!saIdHash) {
    return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 });
  }

  const userRows = await db
    .select({ waNumber: users.waNumber, state: users.state, leaderboardId: users.leaderboardId })
    .from(users)
    .where(and(eq(users.saIdHash, saIdHash), eq(users.state, 'ACTIVE')))
    .limit(1);

  if (userRows.length === 0) {
    return NextResponse.json({ registered: false, leaderboardId: null });
  }

  const weekId = getCurrentWeekId();
  const waNumber = userRows[0].waNumber;

  const linkRows = await db
    .select({ token: links.token })
    .from(links)
    .where(
      and(
        eq(links.waNumber, waNumber),
        eq(links.type, 'PREDICTION'),
        eq(links.status, 'VALID'),
        eq(links.weekId, weekId)
      )
    )
    .orderBy(desc(links.createdAt))
    .limit(1);

  return NextResponse.json({
    registered: true,
    predictionToken: linkRows[0]?.token ?? null,
    leaderboardId: userRows[0].leaderboardId,
  });
}
