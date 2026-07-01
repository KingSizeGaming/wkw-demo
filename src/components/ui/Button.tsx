"use client";

import Link from "next/link";

type ButtonColor = "red" | "green" | "blue" | "purple";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  color?: ButtonColor;
  size?: ButtonSize;
  // When set, the button renders as a navigation link instead of a <button>.
  href?: string;
}

const colorStyles: Record<ButtonColor, { background: string; border?: string }> = {
  red: {
    background: "linear-gradient(180deg, #ef5350 0%, #b71c1c 100%)",
    
    border: "3px solid #ffffff",
  },
  green: {
    background: "linear-gradient(180deg, #4caf50 0%, #1b5e20 100%)",
    border: "3px solid #ffffff",
  },
  blue: {
    background: "linear-gradient(180deg, #42a5f5 0%, #0d47a1 100%)",
    border: "3px solid #ffffff",
  },
  purple: {
    background: "linear-gradient(180deg, #5a096d 0%, #000000 100%)",
    border: "3px solid #ffffff",
  }
};

export default function Button({ color = "red", className = "", href, onKeyDown, onClick, children, ...props }: ButtonProps) {
  const baseClass = `cursor-pointer inline-flex items-center justify-center rounded-2xl font-extrabold text-white tracking-wide py-1 px-6 text-lg transition-opacity disabled:opacity-50 disabled:cursor-not-allowed ${className}`;

  if (href) {
    return (
      <Link href={href} className={baseClass} style={colorStyles[color]}>
        {children}
      </Link>
    );
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLButtonElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      onClick?.(e as unknown as React.MouseEvent<HTMLButtonElement>);
    }
    onKeyDown?.(e);
  }

  return (
    <button
      className={baseClass}
      style={colorStyles[color]}
      onKeyDown={handleKeyDown}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
}
