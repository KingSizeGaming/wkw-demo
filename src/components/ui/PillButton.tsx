"use client";

import Link from "next/link";

type PillVariant = "primary" | "secondary" | "outline" | "whatsapp";

// Flat, full-width pill button used across the web /play flow.
// (Distinct from Button.tsx, which is the gradient "game" button.)
const VARIANTS: Record<PillVariant, string> = {
  // Yellow fill, dark text — the single primary action on a screen.
  primary: "bg-yellow-dark text-purple-dark",
  // Purple fill, yellow text — secondary emphasis.
  secondary: "bg-purple-light text-yellow-dark",
  // Transparent with yellow outline — low-emphasis / link-like action.
  outline: "bg-transparent border border-yellow-dark text-yellow-dark",
  // WhatsApp brand green — the "Play on WhatsApp" entry point.
  whatsapp: "bg-whatsapp text-white",
};

const BASE =
  "font-hitroad inline-flex items-center justify-center h-12 px-4 rounded-full text-base uppercase tracking-wide transition-colors disabled:opacity-40 disabled:cursor-not-allowed";

type CommonProps = {
  variant?: PillVariant;
  fullWidth?: boolean;
  className?: string;
  children: React.ReactNode;
};

// Renders an <a> (Next Link) when `href` is provided, otherwise a <button>.
type PillButtonProps =
  | (CommonProps & { href: string } & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "className" | "children">)
  | (CommonProps & { href?: undefined } & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children">);

export default function PillButton({
  variant = "primary",
  fullWidth = true,
  className = "",
  children,
  ...rest
}: PillButtonProps) {
  const classes = `${BASE} ${VARIANTS[variant]} ${fullWidth ? "w-fit" : ""} ${className}`.trim();

  if ("href" in rest && rest.href !== undefined) {
    const { href, ...anchorProps } = rest as { href: string } & React.AnchorHTMLAttributes<HTMLAnchorElement>;
    return (
      <Link href={href} className={classes} {...anchorProps}>
        {children}
      </Link>
    );
  }

  const buttonProps = rest as React.ButtonHTMLAttributes<HTMLButtonElement>;
  return (
    <button className={classes} {...buttonProps}>
      {children}
    </button>
  );
}
