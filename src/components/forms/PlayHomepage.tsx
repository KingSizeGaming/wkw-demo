"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
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
  viewToken: string | null;
  plusbPoints: number;
  standing: Standing;
}

export interface PlayHomepageProps {
  leaderboardId: string;
  firstName: string;
  onPlayNow: (predictionToken: string) => void;
}

function formatDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("en-ZA", { weekday: "short", day: "numeric", month: "short" });
}

export default function PlayHomepage({ leaderboardId, firstName, onPlayNow }: PlayHomepageProps) {
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
          <PlayTopBar />
          <p className="font-hitroad flex-1 flex items-center justify-center text-lavender">Loading…</p>
        </div>
      </main>
    );
  }

  const { pickStatus, picksAvailable, predictionToken, standing } = data;
  // Any PREDICTION token authorizes the user's own (token-gated) leaderboard page.
  const leaderboardToken = predictionToken ?? data.viewToken;

  return (
    <main className="min-h-screen flex justify-center">
      <div
        className="w-full max-w-125 flex flex-col bg-[url('/images/bg-purple.webp')] bg-cover bg-center"
        style={{
          paddingTop: 'env(safe-area-inset-top)',
          paddingBottom: 'max(env(safe-area-inset-bottom), 80px)',
        }}
      >
        <PlayTopBar />

        <div className="py-5 flex flex-col gap-1">
          {/* Greeting */}
          <div className="px-4 sm:px-6">
            <p className="font-hitroad text-lg">Welcome back, <span className="font-hitroad text-lg font-black text-yellow-dark">{firstName}</span>!</p>
          </div>

          {/* Weekly pick card */}
          <section className="relative w-full bg-[url('/images/entry_big_frame_panel.png')] bg-size-[100%_100%] bg-no-repeat">
            {/* px/py inset keeps content clear of the panel's glow border */}
            <div className="relative z-10 px-8 py-5">
              <header className="flex items-center justify-between mb-3 border-b border-white/10 pb-3">
                <span className="font-hitroad text-xs tracking-wide">Week {data.weekId.slice(-2)}</span>
                <span className="font-hitroad text-[10px] uppercase tracking-wider rounded-full px-2 py-0.5 border border-lavender">
                  {pickStatus === "active" ? "Active" : pickStatus === "picked" ? "Submitted" : "No picks"}
                </span>
              </header>

              {pickStatus === "active" && (
                <div className="flex flex-col gap-3">
                  <div className="flex flex-row gap-3 justify-between">
                    <div className="flex gap-2 items-center shrink-0">
                      <span className="font-hitroad font-black text-5xl leading-none text-yellow-dark">{picksAvailable}</span>
                      <span className="font-hitroad text-sm text-lavender">
                        picks available<br />
                        <span className="text-xs">1 free · {Math.max(picksAvailable - 1, 0)} from points</span>
                      </span>
                    </div>
                    <div className="flex flex-col gap-2">
                    <Button
                      type="button"
                      color="blue"
                      className="w-full h-11 text-sm px-4 tracking-wider font-hitroad uppercase"
                      disabled={picksAvailable === 0 || !predictionToken}
                      onClick={() => predictionToken && onPlayNow(predictionToken)}
                    >
                      Make your pick
                    </Button>
                    
                    {data.entryWeekId && data.viewToken && (
                      <Button
                        color="purple"
                        className="w-full h-11 text-sm px-4 tracking-wider font-hitroad uppercase"
                        href={`/leaderboard/${encodeURIComponent(leaderboardId)}?token=${encodeURIComponent(data.viewToken)}&weekId=${encodeURIComponent(data.entryWeekId)}&home=play`}
                      >
                        View Entries
                      </Button>
                    )}
                    </div>
                    
                  </div>

                  
                </div>
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

          {/* Convert PlusB points — active only, compact chip layout */}
          {pickStatus === "active" && (
            <section className="relative w-full bg-[url('/images/entry_big_frame_panel.png')] bg-size-[100%_100%] bg-no-repeat">
              <div className="relative z-10 px-8 py-5">
                <header className="flex items-center justify-between mb-3 border-b border-white/10 pb-3">
                <span className="font-hitroad text-xs tracking-wide">Convert PlusB points</span>
                </header>
              {data.plusbPoints === 0 ? (
                <p className="font-hitroad text-xs text-lavender-muted">No PlusB points yet.</p>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col items-center shrink-0 px-3 py-2 border border-purple-line rounded-lg bg-purple-dark">
                      <span className="font-hitroadtext-xl leading-none text-yellow-dark">{data.plusbPoints}</span>
                      <span className="font-hitroad text-[9px] text-lavender-muted uppercase tracking-wider mt-0.5">points</span>
                    </div>
                    <span className=" leading-none shrink-0">→</span>
                    <div className="flex items-center border border-purple-line rounded-full overflow-hidden bg-purple-dark shrink-0">
                      <button
                        type="button"
                        onClick={() => setConvertCount((c) => Math.max(1, c - 1))}
                        disabled={convertCount <= 1}
                        aria-label="Fewer entries"
                        className="font-hitroad w-8 h-9 text-yellow-dark disabled:opacity-30"
                      >
                        −
                      </button>
                      <span className="font-hitroad text-yellow-dark text-sm w-5 text-center [font-variant-numeric:tabular-nums]">{convertCount}</span>
                      <button
                        type="button"
                        onClick={() => setConvertCount((c) => Math.min(maxConvert, c + 1))}
                        disabled={convertCount >= maxConvert}
                        aria-label="More entries"
                        className="font-hitroad w-8 h-9 text-yellow-dark disabled:opacity-30"
                      >
                        +
                      </button>
                    </div>
                    <Button type="button" color="purple" onClick={convert} disabled={converting} className="flex-1 text-sm py-2 px-4 tracking-wider font-hitroad uppercase">
                      {converting ? "Converting…" : "Convert"}
                    </Button>
                  </div>
                  <p className="font-hitroad text-[10px] text-lavender-muted py-2 text-center tracking-wide">
                    1 point = 1 entry · max 5 per conversion
                  </p>
                  {convertError && (
                    <p role="alert" className="font-hitroad text-xs mt-2 text-danger-light">{convertError}</p>
                  )}
                </>
              )}

              </div>
              
            </section>
          )}

          {/* Leaderboard standing */}
          <section className="relative w-full bg-[url('/images/entry_big_frame_panel.png')] bg-size-[100%_100%] bg-no-repeat">
            <div className="relative z-10 px-8 py-5">
              <header className="flex items-center justify-between mb-3 border-b border-white/10 pb-3">
                <span className="font-hitroad text-xs tracking-wide">Leaderboard Ranking</span>
              </header>
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
              {/* Full standings list. Pass any PREDICTION token we hold so the viewer's
                  own row is highlighted, plus home=play so the list page shows the Home button. */}
              <Button
                href={
                  leaderboardToken
                    ? `/leaderboard?token=${encodeURIComponent(leaderboardToken)}&home=play`
                    : "/leaderboard?home=play"
                }
                color="purple"
                className="w-full mt-4 h-11 text-sm tracking-wider font-hitroad uppercase"
              >
                View Leaderboard
              </Button>
            </div>
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
