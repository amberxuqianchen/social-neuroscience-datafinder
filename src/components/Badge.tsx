import type { ReactNode } from "react";

type Variant = "default" | "brand" | "accent" | "outline" | "open" | "restricted";

const VARIANTS: Record<Variant, string> = {
  default: "bg-surface-2 text-muted",
  brand: "bg-brand/10 text-brand",
  accent: "bg-accent/10 text-accent",
  outline: "border border-border text-muted",
  open: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  restricted: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
};

export default function Badge({
  children,
  variant = "default",
  title,
}: {
  children: ReactNode;
  variant?: Variant;
  title?: string;
}) {
  return (
    <span
      title={title}
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${VARIANTS[variant]}`}
    >
      {children}
    </span>
  );
}
