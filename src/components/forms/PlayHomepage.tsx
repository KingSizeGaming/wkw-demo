"use client";

import { useEffect, useState } from "react";
import PillButton from "@/components/ui/PillButton";
import TextInput from "@/components/ui/TextInput";
import PlayTopBar from "@/components/ui/PlayTopBar";

interface Standing { tag: string; rank: number | null; score: number | null }
interface HomeData {
  weekId: string;
  pickStatus: "active" | "picked" | "not_available";
  picksAvailable: number;
  predictionToken: string | null;
  nextWeekStartDate: string | null;
  entryWeekId: string | null;
  standing: Standing;
}

export interface PlayHomepageProps {
  leaderboardId: string;
  onPlayNow: (predictionToken: string) => void;
  onBack: () => void;
}

function formatDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("en-ZA", { weekday: "short", day: "numeric", month: "short" });
}

export default function PlayHomepage({ leaderboardId, onPlayNow, onBack }: PlayHomepageProps) {
  const [data, setData] = useState<HomeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState("");
  const [redeeming, setRedeeming] = useState(false);
  const [voucherError, setVoucherError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/play/home?leaderboardId=${encodeURIComponent(leaderboardId)}`);
    if (res.ok) setData(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leaderboardId]);

  async function redeem() {
    setVoucherError(null);
    setRedeeming(true);
    const res = await fetch("/api/play/redeem", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ voucherCode: code, leaderboardId }),
    });
    setRedeeming(false);
    if (res.ok) {
      setCode("");
      await load();
      return;
    }
    const body = await res.json().catch(() => ({}));
    const messages: Record<string, string> = {
      invalid: "That code isn't valid.",
      already_used: "That code has already been used.",
      wrong_week: "That code isn't for this week.",
      missing_fields: "Enter a voucher code.",
    };
    setVoucherError(messages[body.error] ?? "Couldn't redeem that code. Try again.");
  }

  if (loading || !data) {
    return (
      <main className="min-h-screen flex justify-center">
        <div
          className="w-full max-w-125 flex flex-col bg-[url('/images/bg-purple.webp')] bg-cover bg-center"
          style={{
            paddingTop: 'env(safe-area-inset-top)',
            paddingBottom: 'max(env(safe-area-inset-bottom), 80px)',
          }}
        >
          <PlayTopBar onBack={onBack} />
          <p className="font-hitroad flex-1 flex items-center justify-center text-lavender">Loading…</p>
        </div>
      </main>
    );
  }

  const { pickStatus, picksAvailable, predictionToken, standing } = data;

  return (
    <main className="min-h-screen flex justify-center">
      <div
        className="w-full max-w-125 flex flex-col bg-[url('/images/bg-purple.webp')] bg-cover bg-center"
        style={{
          paddingTop: 'env(safe-area-inset-top)',
          paddingBottom: 'max(env(safe-area-inset-bottom), 80px)',
        }}
      >
        <PlayTopBar onBack={onBack} />

        <div className="px-4 sm:px-6 py-5 flex flex-col gap-4">
        {/* Greeting */}
        <div>
          <p className="font-hitroad text-sm text-lavender">Welcome back</p>
          <p className="font-hitroad text-3xl font-black text-yellow-dark">{leaderboardId}</p>
        </div>

        {/* Weekly pick card */}
        <section className="rounded-2xl border border-purple-light bg-violet-dark overflow-hidden">
          <header className="flex items-center justify-between px-4 py-3 border-b border-purple-light">
            <span className="font-hitroad text-xs tracking-wide text-white">Week {data.weekId.slice(-2)}</span>
            <span className="font-hitroad text-[10px] uppercase tracking-wider rounded-full px-2 py-0.5 text-lavender border border-lavender">
              {pickStatus === "active" ? "Active" : pickStatus === "picked" ? "Submitted" : "No picks"}
            </span>
          </header>

          <div className="p-4">
            {pickStatus === "active" && (
              <>
                <div className="flex gap-2 mb-4">
                  <span className="font-hitroad font-black text-5xl leading-none text-yellow-dark">{picksAvailable}</span>
                  <span className="font-hitroad text-sm text-lavender">
                    picks available<br />
                    <span className="text-xs">1 free · {Math.max(picksAvailable - 1, 0)} from vouchers</span>
                  </span>
                </div>
                <PillButton
                  type="button"
                  variant="primary"
                  disabled={picksAvailable === 0 || !predictionToken}
                  onClick={() => predictionToken && onPlayNow(predictionToken)}
                  className="w-full"
                >
                  Make your picks
                </PillButton>
              </>
            )}

            {pickStatus === "picked" && (
              <>
                <p className="font-hitroad text-sm text-white mb-1">Picks submitted</p>
                <p className="font-hitroad text-xs mb-4 text-lavender">Good luck!</p>
                <PillButton
                  variant="outline"
                  href={`/leaderboard/${encodeURIComponent(leaderboardId)}/week/${data.entryWeekId}`}
                >
                  View your picks →
                </PillButton>
              </>
            )}

            {pickStatus === "not_available" && (
              <>
                <p className="font-hitroad text-sm text-lavender">No picks this week</p>
                <p className="font-hitroad text-xs mt-1 opacity-70 text-lavender">
                  Next week opens {formatDate(data.nextWeekStartDate)}
                </p>
              </>
            )}
          </div>
        </section>

        {/* Voucher — active only */}
        {pickStatus === "active" && (
          <section>
            <label htmlFor="voucher" className="font-hitroad block text-xs mb-2 text-lavender">
              Have a voucher code?
            </label>
            <div className="flex gap-2">
              <TextInput
                id="voucher"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Enter code"
                className="flex-1"
              />
              <PillButton
                type="button"
                variant="outline"
                fullWidth={false}
                onClick={redeem}
                disabled={redeeming || code.trim().length === 0}
              >
                {redeeming ? "…" : "Redeem"}
              </PillButton>
            </div>
            {voucherError && (
              <p role="alert" className="font-hitroad text-xs mt-2 text-danger-light">{voucherError}</p>
            )}
          </section>
        )}

        {/* Leaderboard standing */}
        <section className="rounded-2xl border border-purple-light bg-violet-dark p-4">
          <p className="font-hitroad text-xs mb-3 text-lavender">Your standing</p>
          <div className="flex items-center justify-between">
            <span className="font-hitroad font-black text-xl text-yellow-dark">{standing.tag}</span>
            <div className="flex gap-5 [font-variant-numeric:tabular-nums]">
              <div className="text-center">
                <div className="font-hitroad font-black text-2xl text-white leading-none">
                  {standing.rank === null ? "—" : `#${standing.rank}`}
                </div>
                <div className="font-hitroad text-[10px] uppercase tracking-wide text-lavender">Rank</div>
              </div>
              <div className="text-center">
                <div className="font-hitroad font-black text-2xl text-white leading-none">
                  {standing.score === null ? "—" : standing.score}
                </div>
                <div className="font-hitroad text-[10px] uppercase tracking-wide text-lavender">Pts</div>
              </div>
            </div>
          </div>
          {/* DEMO: /play has no leaderboard token, so link to the token-optional
              full-standings list rather than the token-gated per-user detail page. */}
          <PillButton
            href="/leaderboard"
            className="font-hitroad text-xs mt-3 text-yellow-dark bg-purple-light! w-full"
          >
            View Leaderboard
          </PillButton>
        </section>
        </div>
      </div>
    </main>
  );
}
