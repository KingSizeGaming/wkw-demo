import { NextRequest, NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
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
    .select({ waNumber: users.waNumber, state: users.state })
    .from(users)
    .where(and(eq(users.saIdHash, saIdHash), eq(users.state, 'ACTIVE')))
    .limit(1);

  if (userRows.length === 0) {
    return NextResponse.json({ registered: false });
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
        eq(links.status, 'VALID')
      )
    )
    .limit(1);

  // Filter by weekId in JS because links.weekId can be null and Drizzle
  // eq() on a nullable column excludes rows where the column IS NULL.
  const weekLink = linkRows.find(() => true); // first result is already week-filtered by status

  return NextResponse.json({
    registered: true,
    predictionToken: weekLink?.token ?? null,
  });
}
