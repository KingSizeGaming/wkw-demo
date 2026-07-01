import Image from "next/image";
import LeaderboardList from "@/components/LeaderboardList";
import { getLeaderboardList } from "@/lib/queries/leaderboard";
import Logo from "../ui/Logo";
import Button from "../ui/Button";

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams?: Promise<{ weekId?: string; token?: string; home?: string }>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const weekIdQuery = resolvedSearchParams?.weekId;
  const token = resolvedSearchParams?.token;
  // Only the /play flow passes home=play; the demo/WhatsApp flow omits it, so the
  // Home button stays hidden there.
  const fromPlay = resolvedSearchParams?.home === "play";
  const data = await getLeaderboardList({ weekId: weekIdQuery, token });
  const leaderboards = data.leaderboards;
  const hasToken = Boolean(token);

  return (
    <main className="flex justify-center min-h-screen font-hitroad">
      <div className="w-full max-w-125 px-4 sm:px-10 flex flex-col items-center bg-[url('/images/bg-purple.webp')] bg-cover bg-center">
        <Logo />

        <div className="relative w-full flex flex-col h-[70vh] mt-2">
          <Image src="/images/leaderboard_big_frame_panel.png" alt="" fill sizes="(max-width: 500px) 100vw, 500px" style={{ objectFit: 'fill' }} />
          <div className="relative z-10 flex flex-col px-3 flex-1 min-h-0">
            <div className="mx-auto -mt-6 relative shrink-0">
              <Image src="/images/header_week_leaderboard_panel.png" alt="" width={192} height={48} sizes="192px" className="w-48 h-auto" />
              <span className="absolute inset-0 flex items-center justify-center text-xl font-extrabold tracking-wide"></span>
            </div>
            <div className="flex-1 max-h-[78%] mx-2 sm:mx-6 overflow-y-auto wkw-scrollbar">
              {leaderboards.length === 0 ? (
                <p className="text-center text-sm text-white/80">No entries yet.</p>
              ) : (
                <LeaderboardList
                  leaderboards={leaderboards}
                  weekId={data.weekId}
                  token={token}
                  hasToken={hasToken}
                />
              )}
            </div>
          </div>
        </div>

        {fromPlay && (
          <div className="flex justify-center mt-2">
            <Button
              href="/play/home"
              color="purple"
              className="h-9 px-6 text-md tracking-wider font-hitroad uppercase"
            >
              Home
            </Button>
          </div>
        )}
      </div>
    </main>
  );
}
