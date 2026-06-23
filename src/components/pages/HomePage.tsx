import Image from 'next/image';
import Button from '../ui/Button';

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

        {/* CTAs */}
        <div className="flex flex-col gap-4 w-full">
          <Button href="/demo" color="green" className="uppercase font-hitroad py-4">
            Play on WhatsApp
          </Button>
          <Button href="/play" color="purple" className="uppercase font-hitroad py-4">
            Play on Web
          </Button>
        </div>

      </div>
    </main>
  );
}
