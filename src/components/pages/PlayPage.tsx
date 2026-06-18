'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import PredictionClient from '@/components/forms/PredictionClient';
import PlayHomeScreen from '@/components/forms/PlayHomeScreen';
import StepBar from '@/components/ui/StepBar';

const MOCK_SA_ID = '9001015009089';
const MOCK_FIRST_NAME = 'Sipho';
const MOCK_LAST_NAME = 'Dlamini';

type Step = 'welcome' | 'tag' | 'home' | 'predict';

type StatusData = {
  registered: boolean;
  predictionToken?: string | null;
  leaderboardId?: string | null;
};

export default function PlayPage() {
  const [step, setStep] = useState<Step>('welcome');
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

  useEffect(() => {
    fetch(`/api/play/status?saId=${MOCK_SA_ID}`)
      .then((r) => r.json())
      .then((data: StatusData) => setStatusData(data))
      .catch(() => setStatusData({ registered: false }))
      .finally(() => setStatusLoading(false));
  }, []);

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
      setStep('home');
    } catch {
      setRegisterError('Something went wrong. Please try again.');
    } finally {
      setRegisterLoading(false);
    }
  };

  // Home step: render PlayHomeScreen directly (full screen, no chrome)
  if (step === 'home' && leaderboardId) {
    return (
      <PlayHomeScreen
        leaderboardId={leaderboardId}
        onPlayNow={(token) => {
          setPredictionToken(token);
          setStep('predict');
        }}
      />
    );
  }

  // Predict step: render PredictionClient directly (full screen, no chrome)
  if (step === 'predict' && predictionToken) {
    return <PredictionClient token={predictionToken} fontClass="font-hitroad" />;
  }

  return (
    <main
      className="min-h-screen bg-[url('/images/bg-purple.webp')] bg-cover bg-center flex justify-center"
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'max(env(safe-area-inset-bottom), 80px)',
      }}
    >
      <div className="w-full max-w-screen-sm flex flex-col">

        {/* App topbar */}
        <div className="bg-[#3c004d] px-4 py-3 flex items-center justify-between border-b border-[#5a007a] flex-shrink-0">
          <Image
            src="/images/wkw_logo.png"
            alt="Wina Kasi Wina"
            width={80}
            height={32}
            className="h-8 w-auto"
          />
          <span className="bg-[#0057a8] text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded">
            via Pepkor
          </span>
        </div>

        {/* Step progress bar */}
        <StepBar currentStep={step === 'welcome' ? 1 : 2} />

        {/* ── Welcome step ── */}
        {step === 'welcome' && (
          <div className="flex-1 flex flex-col items-center justify-center gap-5 px-6 py-8">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#71009a] to-[#3c004d] border-2 border-[#f6e8a0] flex items-center justify-center text-[#f6e8a0] text-lg font-black">
              {MOCK_FIRST_NAME[0]}{MOCK_LAST_NAME[0]}
            </div>

            <div className="text-center">
              <p className="text-[#d4b3e8] text-sm mb-1">Welcome,</p>
              <p className="text-[#f6e8a0] text-2xl font-black leading-tight">
                {MOCK_FIRST_NAME}
                <br />
                {MOCK_LAST_NAME}
              </p>
            </div>

            <div className="bg-[#25D366]/10 border border-[#25D366] rounded-lg px-4 py-1.5 text-[#25D366] text-xs font-bold">
              ✓ Pepkor account verified
            </div>

            <p className="text-[#9b59b6] text-sm text-center leading-relaxed">
              Ready to predict PSL matches and win prizes?
            </p>

            {statusLoading && (
              <p className="text-[#9b59b6] text-sm animate-pulse">Checking account…</p>
            )}

            {!statusLoading && !statusData?.registered && (
              <button
                onClick={() => setStep('tag')}
                className="w-full h-12 bg-[#71009a] text-[#f6e8a0] font-black uppercase tracking-wide rounded-full text-sm mt-2"
              >
                Register to Play
              </button>
            )}

            {!statusLoading && statusData?.registered && (
              <button
                onClick={() => {
                  setLeaderboardId(statusData.leaderboardId ?? null);
                  setStep('home');
                }}
                className="w-full h-12 bg-[#f6e8a0] text-[#220037] font-black uppercase tracking-wide rounded-full text-sm mt-2"
              >
                Play Now
              </button>
            )}
          </div>
        )}

        {/* ── Tag input step ── */}
        {step === 'tag' && (
          <div className="flex-1 flex flex-col items-center justify-center gap-5 px-6 py-8">
            <p className="text-[#f6e8a0] text-xl font-black text-center leading-tight">
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
                    'w-14 h-16 text-center text-3xl font-black uppercase rounded-xl border-2 bg-white/5 text-[#f6e8a0] focus:outline-none transition-colors',
                    letters[i]
                      ? 'border-[#f6e8a0] bg-[#71009a]/25'
                      : 'border-[#71009a]',
                  ].join(' ')}
                />
              ))}
            </div>

            <p className="text-[#9b59b6] text-xs">+ 3 digits auto-generated</p>

            {/* Live ID preview */}
            <div className="bg-[#71009a]/15 border border-[#71009a] rounded-xl px-8 py-3 text-center w-full">
              <div className="text-2xl font-black tracking-[0.2em]">
                {letters.map((l, i) => (
                  <span key={i} className={l ? 'text-[#c084e8]' : 'text-[#c084e8]/30'}>
                    {l || '_'}
                  </span>
                ))}
                <span className="text-[#c084e8]/30"> •••</span>
              </div>
              <p className="text-[#6b21a8] text-xs mt-1">Your full leaderboard ID</p>
            </div>

            {registerError && (
              <p className="text-red-400 text-sm text-center">{registerError}</p>
            )}

            {/* CTA */}
            <button
              onClick={handleRegisterSubmit}
              disabled={!allLettersFilled || registerLoading}
              className={[
                'w-full h-12 font-black uppercase tracking-wide rounded-full text-sm transition',
                allLettersFilled && !registerLoading
                  ? 'bg-[#f6e8a0] text-[#220037] cursor-pointer'
                  : 'bg-[#f6e8a0]/15 text-[#f6e8a0]/35 cursor-not-allowed',
              ].join(' ')}
            >
              {registerLoading
                ? 'Registering…'
                : allLettersFilled
                ? 'Confirm Tag'
                : 'Need 3 letters'}
            </button>
          </div>
        )}

      </div>
    </main>
  );
}
