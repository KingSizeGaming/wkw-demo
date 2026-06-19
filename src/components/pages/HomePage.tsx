import Image from 'next/image';
import PillButton from '@/components/ui/PillButton';

export default function HomePage() {
  return (
    <main className="min-h-screen flex justify-center items-center">
      <div
        className="w-full max-w-125 min-h-screen flex flex-col items-center justify-center gap-8 px-8 py-12 bg-[url('/images/bg-purple.webp')] bg-cover bg-center"
        style={{
          paddingTop: 'env(safe-area-inset-top)',
          paddingBottom: 'max(env(safe-area-inset-bottom), 80px)',
        }}
      >

        {/* Logo */}
        <Image
          src="/images/wkw_logo.png"
          alt="Wina Kasi Wina"
          width={500}
          height={500}
          sizes="(max-width: 640px) 220px, 260px"
          className="w-52 sm:w-64 h-auto mx-auto"
          priority
        />

        {/* Tagline */}
        <p className="font-hitroad text-lavender text-center text-sm leading-relaxed tracking-wide">
          Predict PSL results. Compete. Win prizes.
        </p>

        {/* CTAs */}
        <div className="flex flex-col gap-4 w-full">
          <PillButton href="/demo" variant="whatsapp" className="gap-2">
            <span className="text-base">📱</span> Play on WhatsApp
          </PillButton>
          <PillButton href="/play" variant="outline">
            Play on Web
          </PillButton>
        </div>

      </div>
    </main>
  );
}
