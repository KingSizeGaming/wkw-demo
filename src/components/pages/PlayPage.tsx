'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import PredictionClient from '@/components/forms/PredictionClient';
import PlayHomepage from '@/components/forms/PlayHomepage';
import StepBar from '@/components/ui/StepBar';
import Button from '@/components/ui/Button';
import PlayTopBar from '@/components/ui/PlayTopBar';

// DEMO: hardcoded identity — every web visitor shares this one SA ID, so all
// web registrations collapse onto a single synthetic user. PRE-PRODUCTION
// BLOCKER: replace with the real authenticated identity before launch.
const MOCK_SA_ID = '9001015009089';
const MOCK_FIRST_NAME = 'John';
const MOCK_LAST_NAME = 'Smith';

// Confetti pieces for the Ready (Kickoff) celebration. Brand colors, spread
// across the width with staggered delays/durations for an organic rain.
const CONFETTI_COLORS = ['#f6e8a0', '#25D366', '#c084e8', '#ffffff', '#c9a3e0'];
const CONFETTI = Array.from({ length: 18 }, (_, i) => ({
  left: `${(i * 5.3 + 3) % 96}%`,
  top: `${(i * 9.7) % 78}%`,
  color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  delay: `${(i % 9) * 0.16}s`,
  duration: `${1.4 + (i % 5) * 0.2}s`,
}));

type Step = 'welcome' | 'tag' | 'ready' | 'home' | 'predict';

type StatusData = {
  registered: boolean;
  predictionToken?: string | null;
  leaderboardId?: string | null;
};

// The /play flow is URL-driven so a refresh keeps the user on the same step:
//   /play          → welcome
//   /play#tag      → tag input (sub-state of the welcome page)
//   /play#ready    → registration confirmation (sub-state, after tag)
//   /play/home     → home
//   /play/predict  → predict
function deriveStep(pathname: string, hash: string): Step {
  if (pathname.startsWith('/play/home')) return 'home';
  if (pathname.startsWith('/play/predict')) return 'predict';
  if (hash === '#ready') return 'ready';
  if (hash === '#tag') return 'tag';
  return 'welcome';
}

export default function PlayPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [hash, setHash] = useState('');

  const [statusData, setStatusData] = useState<StatusData | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [predictionToken, setPredictionToken] = useState<string | null>(null);
  const [leaderboardId, setLeaderboardId] = useState<string | null>(null);

  const [letters, setLetters] = useState<[string, string, string]>(['', '', '']);
  const inputRef0 = useRef<HTMLInputElement>(null);
  const inputRef1 = useRef<HTMLInputElement>(null);
  const inputRef2 = useRef<HTMLInputElement>(null);
  const inputRefs = [inputRef0, inputRef1, inputRef2] as const;

  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);

  // Keep the hash in sync (hashes are client-only; usePathname ignores them).
  // Re-sync on path change so browser back/forward between steps stays correct.
  useEffect(() => {
    const sync = () => setHash(window.location.hash);
    sync();
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, [pathname]);

  // Status is the source of identity on a fresh load/refresh (mock SA ID is constant).
  useEffect(() => {
    fetch(`/api/play/status?saId=${MOCK_SA_ID}`)
      .then((r) => r.json())
      .then((data: StatusData) => setStatusData(data))
      .catch(() => setStatusData({ registered: false }))
      .finally(() => setStatusLoading(false));
  }, []);

  const step = deriveStep(pathname, hash);

  // Identity falls back to the status response so home/predict survive a refresh.
  const lbId = leaderboardId ?? statusData?.leaderboardId ?? null;
  const predToken = predictionToken ?? statusData?.predictionToken ?? null;

  // URL navigation between steps.
  const goTo = (target: Step) => {
    if (target === 'tag') {
      router.push('/play#tag');
      setHash('#tag');
    } else if (target === 'ready') {
      router.push('/play#ready');
      setHash('#ready');
    } else if (target === 'home') {
      router.push('/play/home');
      setHash('');
    } else if (target === 'predict') {
      router.push('/play/predict');
      setHash('');
    } else {
      router.push('/play');
      setHash('');
    }
  };

  // Redirect away from steps that can't be shown (e.g. direct-load /play/predict
  // with no active pick token → back to home; /play/home while unregistered → welcome).
  useEffect(() => {
    if (statusLoading) return;
    if (step === 'ready' && !lbId) router.replace('/play');
    if (step === 'home' && !lbId) router.replace('/play');
    if (step === 'predict' && !predToken) router.replace('/play/home');
  }, [step, statusLoading, lbId, predToken, router]);

  const handleLetterChange = (i: number, val: string) => {
    const char = val.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(-1);
    const next = [...letters] as [string, string, string];
    next[i] = char;
    setLetters(next);
    if (char && i < 2) inputRefs[i + 1].current?.focus();
  };

  const handleLetterKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !letters[i] && i > 0) {
      inputRefs[i - 1].current?.focus();
    }
  };

  const allLettersFilled = letters.every((l) => l.length === 1);
  const previewTag = letters.join('');

  const handleRegisterSubmit = async () => {
    if (!allLettersFilled || registerLoading) return;
    setRegisterLoading(true);
    setRegisterError(null);
    try {
      const res = await fetch('/api/play/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: MOCK_FIRST_NAME,
          lastName: MOCK_LAST_NAME,
          saId: MOCK_SA_ID,
          desiredLeaderboardName: previewTag,
        }),
      });
      const data = await res.json() as { predictionToken?: string; leaderboardId?: string; error?: string };
      if (!res.ok || data.error) {
        setRegisterError(data.error ?? 'Registration failed.');
        return;
      }
      setLeaderboardId(data.leaderboardId ?? null);
      goTo('ready');
    } catch {
      setRegisterError('Something went wrong. Please try again.');
    } finally {
      setRegisterLoading(false);
    }
  };

  // Full-screen branded loading (used while identity resolves on direct load).
  const Loading = (
    <main className="min-h-screen flex justify-center">
      <div className="w-full max-w-125 flex items-center justify-center bg-[url('/images/bg-purple.webp')] bg-cover bg-center">
        <p className="font-hitroad text-lavender">Loading…</p>
      </div>
    </main>
  );

  // Home step: render PlayHomepage directly (full screen, own chrome)
  if (step === 'home') {
    if (!lbId) return Loading;
    return (
      <PlayHomepage
        leaderboardId={lbId}
        firstName={MOCK_FIRST_NAME}
        onPlayNow={(token) => {
          setPredictionToken(token);
          goTo('predict');
        }}
      />
    );
  }

  // Predict step: render PredictionClient directly (full screen, no chrome)
  if (step === 'predict') {
    if (!predToken) return Loading;
    return <PredictionClient token={predToken} fontClass="font-hitroad" onSuccessAction={() => goTo('home')} />;
  }

  return (
    <main className="min-h-screen flex justify-center">
      <div
        className="w-full max-w-125 flex flex-col bg-[url('/images/bg-purple.webp')] bg-cover bg-center"
        style={{
          paddingTop: 'env(safe-area-inset-top)',
          paddingBottom: 'max(env(safe-area-inset-bottom), 80px)',
        }}
      >

        {/* App topbar */}
        <PlayTopBar />

        {/* Step progress bar — hidden for returning/registered users, who skip
            the tag step and go straight to the home page. */}
        {(step === 'tag' || step === 'ready' || (step === 'welcome' && !statusLoading && !statusData?.registered)) && (
          <StepBar currentStep={step === 'welcome' ? 1 : step === 'tag' ? 2 : 3} />
        )}

        {/* ── Welcome step ── */}
        {step === 'welcome' && (
          <div className="flex-1 flex flex-col items-center justify-center gap-5 px-6 py-8">
            <div className="w-14 h-14 rounded-full bg-linear-to-br from-purple-light to-violet-dark border-2 border-yellow-dark flex items-center justify-center text-yellow-dark text-lg font-black">
              {MOCK_FIRST_NAME[0]}{MOCK_LAST_NAME[0]}
            </div>

            <div className="text-center">
              <p className="font-hitroad text-lavender text-sm mb-1">Welcome,</p>
              <p className="font-hitroad text-yellow-dark text-2xl font-black leading-tight">
                {MOCK_FIRST_NAME} {MOCK_LAST_NAME}
              </p>
            </div>

            <div className="font-hitroad bg-whatsapp/10 border border-whatsapp rounded-lg px-4 py-1.5 text-whatsapp text-xs font-bold">
              ✓ Pepkor account verified
            </div>

            {/* <p className="font-hitroad text-sm text-center leading-relaxed">
              Ready to predict PSL matches and win prizes?
            </p> */}

            {statusLoading && (
              <p className="font-hitroad text-lavender-muted text-sm animate-pulse">Checking account…</p>
            )}

            {!statusLoading && !statusData?.registered && (
              <Button color="purple" className="px-4 mt-2 font-hitroad uppercase" onClick={() => goTo('tag')}>
                Register to Play
              </Button>
            )}

            {!statusLoading && statusData?.registered && (
              <Button
                type="button"
                color="blue"
                className="mt-2 h-11 px-6 text-sm tracking-wider font-hitroad uppercase"
                onClick={() => {
                  setLeaderboardId(statusData.leaderboardId ?? null);
                  goTo('home');
                }}
              >
                Play Now
              </Button>
            )}
          </div>
        )}

        {/* ── Tag input step ── */}
        {step === 'tag' && (
          <div className="flex-1 flex flex-col items-center justify-center gap-5 px-6 py-8 mx-8 my-2 bg-size-[100%_100%] bg-no-repeat bg-[url('/images/entry_big_frame_panel.png')]">
            <p className="font-hitroad text-yellow-dark text-xl font-black text-center leading-tight">
              What should
              <br />
              we call you?
            </p>

            {/* OTP boxes */}
            <div className="flex gap-3">
              {([0, 1, 2] as const).map((i) => (
                <input
                  key={i}
                  ref={inputRefs[i]}
                  type="text"
                  inputMode="text"
                  autoCapitalize="characters"
                  value={letters[i]}
                  onChange={(e) => handleLetterChange(i, e.target.value)}
                  onKeyDown={(e) => handleLetterKeyDown(i, e)}
                  className={[
                    "font-hitroad w-14 h-16 text-center text-3xl font-black uppercase rounded-xl border-2 bg-[url('/images/player_points_panel.png')] bg-cover bg-center text-yellow-dark focus:outline-none transition-colors",
                    letters[i]
                      ? 'border-yellow-dark bg-purple-light/25'
                      : 'border-purple-light',
                  ].join(' ')}
                />
              ))}
            </div>

            <p className="font-hitroad text-lavender text-xs">+ 3 digits auto-generated</p>

            {/* Live ID preview */}
            <div className="bg-[url('/images/player_points_panel.png')] bg-cover bg-center px-10 py-3 text-center">
              <div className="font-hitroad text-2xl font-black tracking-[0.2em]">
                {letters.map((l, i) => (
                  <span key={i} className={l ? 'text-white' : 'text-lavender'}>
                    {l || '_'}
                  </span>
                ))}
                <span> •••</span>
              </div>
              <p className="font-hitroad text-lavender text-xs mt-1">Your full leaderboard ID</p>
            </div>

            {registerError && (
              <p className="font-hitroad text-danger-light text-sm text-center">{registerError}</p>
            )}

            {/* CTA */}
            <Button
              color="purple"
              className="uppercase font-hitroad tracking-wider"
              onClick={handleRegisterSubmit}
              disabled={!allLettersFilled || registerLoading}
            >
              {registerLoading
                ? 'Registering…'
                : allLettersFilled
                ? 'Confirm Tag'
                : 'Need 3 letters'}
            </Button>
          </div>
        )}

        {/* ── Ready step (Kickoff): registration confirmed, launch into play ── */}
        {step === 'ready' && lbId && (
          <div className="relative flex-1 flex flex-col items-center justify-center px-6 py-8 overflow-hidden">
            {/* Confetti party burst (behind content) */}
            <div className="pointer-events-none absolute inset-0 z-0" aria-hidden="true">
              {CONFETTI.map((c, i) => (
                <span
                  key={i}
                  className="wkw-confetti"
                  style={{
                    left: c.left,
                    top: c.top,
                    background: c.color,
                    animationDelay: c.delay,
                    animationDuration: c.duration,
                  }}
                />
              ))}
            </div>

            <div className="relative z-10 flex flex-col items-center gap-5">
            <p className="font-hitroad text-purple-accent text-xs uppercase tracking-[0.22em]">
              Match ready
            </p>

            <p className="font-hitroad text-yellow-dark text-5xl font-black text-center leading-none uppercase">
              You&apos;re In
            </p>

            {/* Scoreboard-style leaderboard ID: letters + auto-generated digits */}
            <div className="flex items-center gap-2 bg-black border border-purple-line rounded-xl px-4 py-3">
              <span className="font-hitroad text-black text-4xl font-black tracking-wider rounded-lg border border-yellow-dark/25 bg-yellow-dark px-3 py-1">
                {lbId.slice(0, 3)}
              </span>
              {/* <span className="font-hitroad text-lavender-muted text-xs uppercase tracking-[0.2em]">ID</span> */}
              <span className="font-hitroad text-4xl font-black tracking-wider rounded-lg border border-purple-light/40 bg-purple-light px-3 py-1">
                {lbId.slice(3)}
              </span>
            </div>

            <p className="font-hitroad text-lavender text-sm text-center leading-relaxed max-w-[26ch]">
              Leaderboard <span className="text-yellow-dark font-black">{lbId} </span> is live. <br />The whistle&apos;s yours.
            </p>

            {/* CTA */}
            <Button
              color="blue"
              className="uppercase font-hitroad tracking-wider mt-2"
              onClick={() => goTo('home')}
            >
              Kick Off
            </Button>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
