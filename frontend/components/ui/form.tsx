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

export function TextInput({ id, error, ...props }: ComponentProps<"input"> & { id: string; error?: string }) {
  return (
    <input
      id={id}
      name={id}
      aria-invalid={error ? true : undefined}
      aria-describedby={error ? `${id}-error` : `${id}-hint`}
      className={inputClass}
      {...props}
    />
  );
}

export function Select({ id, error, children, ...props }: ComponentProps<"select"> & { id: string; error?: string }) {
  return (
    <select
      id={id}
      name={id}
      aria-invalid={error ? true : undefined}
      className={`${inputClass} appearance-none bg-[length:16px] bg-[right_0.75rem_center] bg-no-repeat pr-10`}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 256 256' fill='%2356665d'%3E%3Cpath d='M213.66 101.66l-80 80a8 8 0 0 1-11.32 0l-80-80a8 8 0 0 1 11.32-11.32L128 164.69l74.34-74.35a8 8 0 0 1 11.32 11.32Z'/%3E%3C/svg%3E\")",
      }}
      {...props}
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
