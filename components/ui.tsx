import type {
  ButtonHTMLAttributes,
  HTMLAttributes,
  InputHTMLAttributes,
  LabelHTMLAttributes,
  ProgressHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

export function cn(
  ...classes: Array<string | false | null | undefined>
): string {
  return classes.filter(Boolean).join(" ");
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  action,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="max-w-3xl">
        {eyebrow ? (
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--accent)]">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-3xl font-bold tracking-normal text-[color:var(--text)] sm:text-4xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 text-base text-[color:var(--muted)]">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

type CardTone = "default" | "success" | "quiet";

export function Card({
  children,
  className,
  tone = "default",
  ...props
}: HTMLAttributes<HTMLDivElement> & { tone?: CardTone }) {
  const toneClass = {
    default: "border-[color:var(--border)] bg-[color:var(--surface)]",
    success:
      "border-[color:var(--success)] bg-[color:var(--primary-soft)] text-[color:var(--text)]",
    quiet: "border-[color:var(--border)] bg-[color:var(--surface-muted)]",
  }[tone];

  return (
    <section
      className={cn("rounded-xl border p-5 shadow-sm", toneClass, className)}
      {...props}
    >
      {children}
    </section>
  );
}

export function CardHeader({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between",
        className,
      )}
    >
      <div>
        <h2 className="text-xl font-bold tracking-normal text-[color:var(--text)]">
          {title}
        </h2>
        {description ? (
          <p className="mt-1 text-sm text-[color:var(--muted)]">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

export function Button({
  className,
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
}) {
  const variants: Record<ButtonVariant, string> = {
    primary:
      "border-[color:var(--primary)] bg-[color:var(--primary)] text-white hover:bg-[color:var(--primary-strong)]",
    secondary:
      "border-[color:var(--border-strong)] bg-[color:var(--surface)] text-[color:var(--text)] hover:bg-[color:var(--surface-muted)]",
    ghost:
      "border-transparent bg-transparent text-[color:var(--muted)] hover:bg-[color:var(--surface-muted)] hover:text-[color:var(--text)]",
    danger:
      "border-[#b98d82] bg-[#fff4f1] text-[#7a3026] hover:bg-[#fae7e2]",
  };

  return (
    <button
      className={cn(
        "inline-flex min-h-10 items-center justify-center rounded-lg border px-4 py-2 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[rgba(49,95,86,0.28)]",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}

export function Label({
  className,
  ...props
}: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn(
        "mb-1.5 block text-sm font-bold text-[color:var(--text)]",
        className,
      )}
      {...props}
    />
  );
}

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "min-h-11 w-full rounded-lg border border-[color:var(--border)] bg-white px-3 py-2 text-[color:var(--text)] shadow-sm outline-none transition placeholder:text-[color:var(--subtle)] focus:border-[color:var(--primary)] focus:ring-[3px] focus:ring-[rgba(49,95,86,0.14)]",
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-28 w-full resize-y rounded-lg border border-[color:var(--border)] bg-white px-3 py-2 text-[color:var(--text)] shadow-sm outline-none transition placeholder:text-[color:var(--subtle)] focus:border-[color:var(--primary)] focus:ring-[3px] focus:ring-[rgba(49,95,86,0.14)]",
        className,
      )}
      {...props}
    />
  );
}

export function Select({
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "min-h-11 w-full rounded-lg border border-[color:var(--border)] bg-white px-3 py-2 text-[color:var(--text)] shadow-sm outline-none transition focus:border-[color:var(--primary)] focus:ring-[3px] focus:ring-[rgba(49,95,86,0.14)]",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label>{label}</Label>
      {children}
      {hint ? (
        <p className="mt-1.5 text-xs text-[color:var(--muted)]">{hint}</p>
      ) : null}
    </div>
  );
}

export function CheckboxRow({
  label,
  description,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  description?: string;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-lg border border-[color:var(--border)] bg-white p-3 transition hover:bg-[color:var(--surface-muted)]",
        className,
      )}
    >
      <input
        type="checkbox"
        className="mt-1 h-4 w-4 rounded border-[color:var(--border-strong)] text-[color:var(--primary)] focus:ring-[color:var(--primary)]"
        {...props}
      />
      <span>
        <span className="block text-sm font-bold text-[color:var(--text)]">
          {label}
        </span>
        {description ? (
          <span className="mt-0.5 block text-sm text-[color:var(--muted)]">
            {description}
          </span>
        ) : null}
      </span>
    </label>
  );
}

export function Badge({
  children,
  className,
  tone = "neutral",
}: {
  children: ReactNode;
  className?: string;
  tone?: "neutral" | "success" | "warning" | "accent";
}) {
  const tones = {
    neutral: "border-[color:var(--border)] bg-[color:var(--surface-muted)] text-[color:var(--muted)]",
    success: "border-[#b8d1c3] bg-[#edf6f0] text-[color:var(--success)]",
    warning: "border-[#dfcca0] bg-[#fff8e5] text-[color:var(--warning)]",
    accent: "border-[#dec7ad] bg-[#fff4e7] text-[color:var(--accent)]",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-dashed border-[color:var(--border-strong)] bg-[color:var(--surface)] p-6 text-center",
        className,
      )}
    >
      <h3 className="text-lg font-bold text-[color:var(--text)]">{title}</h3>
      <p className="mx-auto mt-2 max-w-xl text-sm text-[color:var(--muted)]">
        {description}
      </p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function ProgressBar({
  value,
  max = 100,
  label,
  className,
  ...props
}: ProgressHTMLAttributes<HTMLProgressElement> & {
  value: number;
  max?: number;
  label?: string;
}) {
  const percent = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;

  return (
    <div className={className}>
      {label ? (
        <div className="mb-1.5 flex items-center justify-between text-sm">
          <span className="font-bold text-[color:var(--text)]">{label}</span>
          <span className="text-[color:var(--muted)]">
            {value} / {max}
          </span>
        </div>
      ) : null}
      <progress className="sr-only" value={value} max={max} {...props} />
      <div
        className="h-2 overflow-hidden rounded-full bg-[color:var(--surface-muted)]"
        aria-hidden="true"
      >
        <div
          className="h-full rounded-full bg-[color:var(--primary)]"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

export function SimpleGrid({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("grid gap-4 md:grid-cols-2 xl:grid-cols-3", className)}
      {...props}
    />
  );
}
