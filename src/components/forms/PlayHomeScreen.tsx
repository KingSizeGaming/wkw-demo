"use client";

import { useEffect, useState } from "react";

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

export interface PlayHomeScreenProps {
  leaderboardId: string;
  onPlayNow: (predictionToken: string) => void;
}

const LAVENDER = "#c9a3e0";

function formatDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("en-ZA", { weekday: "short", day: "numeric", month: "short" });
}

export default function PlayHomeScreen({ leaderboardId, onPlayNow }: PlayHomeScreenProps) {
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
      <div className="px-5 py-6 text-center" style={{ color: LAVENDER }}>
        Loading…
      </div>
    );
  }

  const { pickStatus, picksAvailable, predictionToken, standing } = data;

  return (
    <div className="flex flex-col gap-4 px-5 py-5">
      {/* Greeting */}
      <div>
        <p className="text-sm" style={{ color: LAVENDER }}>Welcome back</p>
        <p className="font-hitroad text-3xl text-[#f6e8a0]">{leaderboardId}</p>
      </div>

      {/* Weekly pick card */}
      <section className="rounded-2xl border border-[#71009a] bg-[#3c004d] overflow-hidden">
        <header className="flex items-center justify-between px-4 py-3 border-b border-[#71009a]">
          <span className="text-xs tracking-wide text-white">Week {data.weekId.slice(-2)}</span>
          <span className="text-[10px] uppercase tracking-wider rounded-full px-2 py-0.5"
                style={{ color: LAVENDER, border: `1px solid ${LAVENDER}` }}>
            {pickStatus === "active" ? "Active" : pickStatus === "picked" ? "Submitted" : "No picks"}
          </span>
        </header>

        <div className="p-4">
          {pickStatus === "active" && (
            <>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="font-hitroad text-5xl leading-none text-[#f6e8a0]">{picksAvailable}</span>
                <span className="text-sm" style={{ color: LAVENDER }}>
                  picks available<br />
                  <span className="text-xs">1 free · {Math.max(picksAvailable - 1, 0)} from vouchers</span>
                </span>
              </div>
              <button
                type="button"
                disabled={picksAvailable === 0 || !predictionToken}
                onClick={() => predictionToken && onPlayNow(predictionToken)}
                className="font-arlrdbd w-full h-12 rounded-2xl bg-[#f6e8a0] text-[#220037] disabled:opacity-40"
              >
                Make your picks
              </button>
            </>
          )}

          {pickStatus === "picked" && (
            <>
              <p className="text-sm text-white mb-1">Picks submitted</p>
              <p className="text-xs mb-4" style={{ color: LAVENDER }}>Good luck!</p>
              <a
                href={`/leaderboard/${encodeURIComponent(leaderboardId)}/week/${data.entryWeekId}`}
                className="font-arlrdbd flex items-center justify-center w-full h-12 rounded-2xl border border-[#f6e8a0] text-[#f6e8a0]"
              >
                View your picks →
              </a>
            </>
          )}

          {pickStatus === "not_available" && (
            <>
              <p className="text-sm" style={{ color: LAVENDER }}>No picks this week</p>
              <p className="text-xs mt-1 opacity-70" style={{ color: LAVENDER }}>
                Next week opens {formatDate(data.nextWeekStartDate)}
              </p>
            </>
          )}
        </div>
      </section>

      {/* Voucher — active only */}
      {pickStatus === "active" && (
        <section>
          <label htmlFor="voucher" className="block text-xs mb-2" style={{ color: LAVENDER }}>
            Have a voucher code?
          </label>
          <div className="flex gap-2">
            <input
              id="voucher"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Enter code"
              className="flex-1 h-12 rounded-2xl bg-[#3c004d] border border-[#71009a] px-3 text-white placeholder:text-[#9a7bb0] uppercase tracking-wider"
            />
            <button
              type="button"
              onClick={redeem}
              disabled={redeeming || code.trim().length === 0}
              className="font-arlrdbd h-12 px-4 rounded-2xl border border-[#f6e8a0] text-[#f6e8a0] disabled:opacity-40"
            >
              {redeeming ? "…" : "Redeem"}
            </button>
          </div>
          {voucherError && (
            <p role="alert" className="text-xs mt-2 text-[#ff9b9b]">{voucherError}</p>
          )}
        </section>
      )}

      {/* Leaderboard standing */}
      <section className="rounded-2xl border border-[#71009a] bg-[#3c004d] p-4">
        <p className="text-xs mb-3" style={{ color: LAVENDER }}>Your standing</p>
        <div className="flex items-center justify-between">
          <span className="font-hitroad text-xl text-[#f6e8a0]">{standing.tag}</span>
          <div className="flex gap-5 [font-variant-numeric:tabular-nums]">
            <div className="text-center">
              <div className="font-hitroad text-2xl text-white leading-none">
                {standing.rank === null ? "—" : `#${standing.rank}`}
              </div>
              <div className="text-[10px] uppercase tracking-wide" style={{ color: LAVENDER }}>Rank</div>
            </div>
            <div className="text-center">
              <div className="font-hitroad text-2xl text-white leading-none">
                {standing.score === null ? "—" : standing.score}
              </div>
              <div className="text-[10px] uppercase tracking-wide" style={{ color: LAVENDER }}>Pts</div>
            </div>
          </div>
        </div>
        <a
          href={`/leaderboard/${encodeURIComponent(leaderboardId)}`}
          className="block text-right text-xs mt-3"
          style={{ color: LAVENDER }}
        >
          View full leaderboard →
        </a>
      </section>
    </div>
  );
}
