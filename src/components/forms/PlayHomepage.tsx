"use client";

import { useEffect, useState } from "react";
import PillButton from "@/components/ui/PillButton";
import PlayTopBar from "@/components/ui/PlayTopBar";
import ConvertSuccessModal from "@/components/modals/ConvertSuccessModal";

interface Standing { tag: string; rank: number | null; score: number | null }
interface HomeData {
  weekId: string;
  pickStatus: "active" | "picked" | "not_available";
  picksAvailable: number;
  predictionToken: string | null;
  nextWeekStartDate: string | null;
  entryWeekId: string | null;
  plusbPoints: number;
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
  const [convertCount, setConvertCount] = useState(1);
  const [converting, setConverting] = useState(false);
  const [convertError, setConvertError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastConverted, setLastConverted] = useState(0);

  const maxConvert = data ? Math.min(5, data.plusbPoints) : 1;

  useEffect(() => {
    setConvertCount((c) => Math.min(Math.max(1, c), Math.max(1, maxConvert)));
  }, [maxConvert]);

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

  async function convert() {
    setConvertError(null);
    setConverting(true);
    const res = await fetch("/api/play/convert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leaderboardId, amount: convertCount }),
    });
    setConverting(false);
    if (res.ok) {
      setLastConverted(convertCount);
      setShowSuccess(true);
      setConvertCount(1);
      await load();
      return;
    }
    const body = await res.json().catch(() => ({}));
    const messages: Record<string, string> = {
      insufficient_points: "You don't have enough points.",
      max_exceeded: "You can convert at most 5 at a time.",
      invalid_amount: "Choose at least 1 entry.",
      user_not_found: "Couldn't find your account.",
    };
    setConvertError(messages[body.error] ?? "Couldn't convert. Try again.");
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
                      <span className="text-xs">1 free · {Math.max(picksAvailable - 1, 0)} from points</span>
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

          {/* Convert PlusB points — active only */}
          {pickStatus === "active" && (
            <section>
              <p className="font-hitroad block text-xs mb-2 text-lavender">Convert PlusB points</p>
              {data.plusbPoints === 0 ? (
                <p className="font-hitroad text-xs text-lavender-muted">No PlusB points yet.</p>
              ) : (
                <>
                  <p className="font-hitroad text-sm text-lavender mb-3">
                    You have <span className="text-yellow-dark">{data.plusbPoints}</span> points
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setConvertCount((c) => Math.max(1, c - 1))}
                        disabled={convertCount <= 1}
                        aria-label="Fewer entries"
                        className="font-hitroad w-9 h-9 rounded-full border border-purple-light text-yellow-dark disabled:opacity-40"
                      >
                        −
                      </button>
                      <span className="font-hitroad text-yellow-dark text-lg w-6 text-center [font-variant-numeric:tabular-nums]">
                        {convertCount}
                      </span>
                      <button
                        type="button"
                        onClick={() => setConvertCount((c) => Math.min(maxConvert, c + 1))}
                        disabled={convertCount >= maxConvert}
                        aria-label="More entries"
                        className="font-hitroad w-9 h-9 rounded-full border border-purple-light text-yellow-dark disabled:opacity-40"
                      >
                        +
                      </button>
                    </div>
                    <PillButton type="button" variant="primary" onClick={convert} disabled={converting}>
                      {converting ? "…" : `Convert ${convertCount} → ${convertCount} ${convertCount === 1 ? "entry" : "entries"}`}
                    </PillButton>
                  </div>
                  {convertError && (
                    <p role="alert" className="font-hitroad text-xs mt-2 text-danger-light">{convertError}</p>
                  )}
                </>
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

      {showSuccess && (
        <ConvertSuccessModal
          entries={lastConverted}
          picksAvailable={data.picksAvailable}
          onClose={() => setShowSuccess(false)}
        />
      )}
    </main>
  );
}
