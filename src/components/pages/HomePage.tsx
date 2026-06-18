import Image from 'next/image';
import Link from 'next/link';

export default function HomePage() {
  return (
    <main
      className="min-h-screen bg-[url('/images/bg-purple.webp')] bg-cover bg-center flex justify-center items-center"
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'max(env(safe-area-inset-bottom), 80px)',
      }}
    >
      <div className="w-full max-w-screen-sm flex flex-col items-center gap-8 px-8 py-12">

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
        <p className="text-[#d4b3e8] text-center text-sm leading-relaxed tracking-wide">
          Predict PSL results. Compete. Win prizes.
        </p>

        {/* CTAs */}
        <div className="flex flex-col gap-4 w-full">
          <Link
            href="/demo"
            className="flex items-center justify-center gap-2 w-full h-12 bg-[#25D366] text-white font-black uppercase tracking-wide rounded-full text-sm"
          >
            <span className="text-base">📱</span> Play on WhatsApp
          </Link>
          <Link
            href="/play"
            className="flex items-center justify-center w-full h-12 border border-[#f6e8a0] text-[#f6e8a0] font-black uppercase tracking-wide rounded-full text-sm"
          >
            Play on Web
          </Link>
        </div>

      </div>
    </main>
  );
}
