import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { plusbCredits, plusbPoints } from "@/db/schema";

// Credits PlusB points to a person (keyed by sa_id_hash), idempotently by
// transactionId. A duplicate transactionId is a no-op that returns the current
// balance. Shared by the external PlusB webhook (/api/plusb/points) and the
// demo admin button (/api/admin/plusb).
export async function creditPlusbPoints(params: {
  saIdHash: string;
  transactionId: string;
  amount: number;
}): Promise<{ balance: number; duplicate: boolean }> {
  const { saIdHash, transactionId, amount } = params;

  return db.transaction(async (tx) => {
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
}
