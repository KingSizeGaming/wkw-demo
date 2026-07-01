import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { users, links } from '@/db/schema';
import { hashSaId } from '@/lib/sa-id-server';
import { parseSaIdBirthDate, isAtLeastAge } from '@/lib/sa-id';
import { generateUniqueLeaderboardId } from '@/lib/leaderboard';
import { generateToken } from '@/lib/tokens';
import { getCurrentWeekId, getIsoWeekEndUtc } from '@/lib/week';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const firstName = String(body?.firstName ?? '').trim();
  const lastName = String(body?.lastName ?? '').trim();
  const saId = String(body?.saId ?? '').trim();
  const desiredLeaderboardName = String(body?.desiredLeaderboardName ?? '').trim();

  if (!firstName || !lastName || !saId || !desiredLeaderboardName) {
    return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
  }

  const birthDate = parseSaIdBirthDate(saId);
  if (!birthDate) {
    return NextResponse.json({ error: 'SA Identity Number is invalid.' }, { status: 400 });
  }
  if (!isAtLeastAge(birthDate, 18)) {
    return NextResponse.json({ error: 'You must be at least 18 years old to register.' }, { status: 400 });
  }

  const saIdHash = hashSaId(saId);
  if (!saIdHash) {
    return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 });
  }

  const syntheticWaNumber = `web:${saIdHash.slice(0, 12)}`;

  const result = await db.transaction(async (tx) => {
    const existingBySaId = await tx
      .select({ state: users.state })
      .from(users)
      .where(eq(users.saIdHash, saIdHash))
      .limit(1);

    if (existingBySaId.length > 0 && existingBySaId[0].state === 'ACTIVE') {
      return { error: 'Already registered. Use "Play Now" to continue.' } as const;
    }

    const existsFn = async (candidate: string) => {
      const rows = await tx
        .select({ id: users.id })
        .from(users)
        .where(eq(users.leaderboardId, candidate))
        .limit(1);
      return rows.length > 0;
    };

    const leaderboardId = await generateUniqueLeaderboardId(desiredLeaderboardName, existsFn);
    const now = new Date();
    const weekId = getCurrentWeekId();

    const existingByWa = await tx
      .select({ id: users.id })
      .from(users)
      .where(eq(users.waNumber, syntheticWaNumber))
      .limit(1);

    if (existingByWa.length === 0) {
      await tx.insert(users).values({
        waNumber: syntheticWaNumber,
        state: 'ACTIVE',
        leaderboardId,
        firstName,
        lastName,
        saIdHash,
      });
    } else {
      await tx
        .update(users)
        .set({ state: 'ACTIVE', leaderboardId, firstName, lastName, saIdHash })
        .where(eq(users.waNumber, syntheticWaNumber));
    }

    const predictionToken = generateToken('pred');

    await tx.insert(links).values({
      token: predictionToken,
      type: 'PREDICTION',
      waNumber: syntheticWaNumber,
      weekId,
      status: 'VALID',
      expiresAt: getIsoWeekEndUtc(now),
    });

    return { predictionToken, leaderboardId } as const;
  });

  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(result);
}
