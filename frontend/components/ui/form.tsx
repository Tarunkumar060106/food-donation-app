import type { ComponentProps, ReactNode } from "react";

export const inputClass =
  "w-full rounded-[10px] border border-line bg-surface px-3.5 py-2.5 text-[15px] text-ink placeholder:text-muted/70 transition focus:border-forest focus:outline-none focus:ring-2 focus:ring-forest/20 disabled:opacity-60 aria-[invalid=true]:border-accent";

export function Field({
  id,
  label,
  hint,
  error,
  optional,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  optional?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {label}
        {optional && <span className="font-normal text-muted"> (optional)</span>}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-sm text-accent">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-sm text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function TextInput({ id, error, className = "", ...props }: ComponentProps<"input"> & { id: string; error?: string }) {
  return (
    <input
      id={id}
      name={id}
      aria-invalid={error ? true : undefined}
      aria-describedby={error ? `${id}-error` : `${id}-hint`}
      {...props}
      className={`${inputClass} ${className}`}
    />
  );
}

const pillSelectClass =
  "rounded-full border border-line bg-surface py-2 pl-4 pr-9 text-sm text-ink transition hover:border-ink/30 focus:border-forest focus:outline-none focus:ring-2 focus:ring-forest/20 disabled:opacity-50";

/** Native select with a CSS-drawn chevron (`fr-select` in globals.css). `pill` is the compact toolbar style. */
export function Select({
  id,
  error,
  children,
  className = "",
  variant = "field",
  ...props
}: ComponentProps<"select"> & { id: string; error?: string; variant?: "field" | "pill" }) {
  return (
    <select
      id={id}
      name={id}
      aria-invalid={error ? true : undefined}
      {...props}
      className={`fr-select ${variant === "pill" ? pillSelectClass : `${inputClass} pr-10`} ${className}`}
    >
      {children}
    </select>
  );
}

export function FormAlert({ children }: { children: ReactNode }) {
  return (
    <div role="alert" className="rounded-[10px] border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-ink">
      {children}
    </div>
  );
}

export const primaryButton =
  "inline-flex items-center justify-center gap-2 rounded-full bg-accent px-6 py-3 font-medium text-on-accent transition hover:bg-accent-hover active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60";

export const secondaryButton =
  "inline-flex items-center justify-center gap-2 rounded-full border border-line px-5 py-2.5 font-medium text-ink transition hover:border-ink/40 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60";
