"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";

// Shared chrome for the web /play flow
export default function PlayTopBar() {
  const router = useRouter();

  return (
    <div className="bg-violet-dark px-4 py-3 flex items-center justify-between border-b border-purple-line shrink-0">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => router.push("/play")}
          aria-label="Go back"
          className="w-8 h-8 -ml-1 flex items-center justify-center rounded-full text-yellow-dark hover:bg-white/10 active:bg-white/15 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" className="-rotate-90">
            <path d="M12.884 5.11597C12.6492 4.88221 12.3313 4.75098 12 4.75098C11.6687 4.75098 11.3508 4.88221 11.116 5.11597L6.11601 10.116C5.99992 10.2321 5.90784 10.3699 5.84501 10.5216C5.78218 10.6732 5.74985 10.8358 5.74985 11C5.74985 11.3315 5.88156 11.6495 6.11601 11.884C6.35046 12.1184 6.66845 12.2501 7.00001 12.2501C7.33158 12.2501 7.64956 12.1184 7.88401 11.884L10.75 9.01797V18C10.75 18.3315 10.8817 18.6494 11.1161 18.8839C11.3505 19.1183 11.6685 19.25 12 19.25C12.3315 19.25 12.6495 19.1183 12.8839 18.8839C13.1183 18.6494 13.25 18.3315 13.25 18V9.01797L16.116 11.884C16.2321 12.0001 16.3699 12.0921 16.5216 12.155C16.6733 12.2178 16.8358 12.2501 17 12.2501C17.1642 12.2501 17.3268 12.2178 17.4784 12.155C17.6301 12.0921 17.7679 12.0001 17.884 11.884C18.0001 11.7679 18.0922 11.6301 18.155 11.4784C18.2178 11.3267 18.2502 11.1641 18.2502 11C18.2502 10.8358 18.2178 10.6732 18.155 10.5216C18.0922 10.3699 18.0001 10.2321 17.884 10.116L12.884 5.11597Z" fill="currentColor"/>
          </svg>
        </button>
        <Image
          src="/images/wkw_logo.png"
          alt="Wina Kasi Wina"
          width={80}
          height={32}
          className="h-8 w-auto"
        />
      </div>
      <span className="font-hitroad bg-pepkor-blue text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded">
        via Pepkor
      </span>
    </div>
  );
}
