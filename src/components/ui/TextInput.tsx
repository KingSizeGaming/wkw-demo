"use client";

// Unlabeled text input styled for the dark /play surfaces.
// (FormField.tsx is the labeled, rounded-full registration input; this is the
// bare field used in compact contexts like voucher redemption.)
export default function TextInput({
  className = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`font-arial-rounded h-12 rounded-2xl bg-violet-dark border border-purple-light px-3 text-white placeholder:text-lavender-muted tracking-wider outline-none ${className}`}
      {...props}
    />
  );
}
