import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  TextareaHTMLAttributes,
} from "react";

export type IconName =
  | "arrow"
  | "web"
  | "phone"
  | "pos"
  | "qr"
  | "code"
  | "layers"
  | "check"
  | "sun"
  | "moon"
  | "menu"
  | "close"
  | "download"
  | "spark"
  | "plus";
const paths: Record<IconName, ReactNode> = {
  arrow: (
    <>
      <path d="M4 12h15M13 5l7 7-7 7" />
    </>
  ),
  web: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="3" />
      <path d="M3 9h18M7 6.5h.01M10 6.5h.01" />
    </>
  ),
  phone: (
    <>
      <rect x="6" y="2" width="12" height="20" rx="3" />
      <path d="M10 18h4M10 5h4" />
    </>
  ),
  pos: (
    <>
      <rect x="3" y="3" width="18" height="13" rx="2" />
      <path d="M8 21h8M12 16v5M7 7h4M7 11h8" />
    </>
  ),
  qr: (
    <>
      <path d="M3 3h6v6H3zM15 3h6v6h-6zM3 15h6v6H3zM15 15h3v3h3v3h-6zM21 12v1M12 3v4M12 12h5M3 12h5M12 16v5" />
    </>
  ),
  code: (
    <>
      <path d="m8 6-6 6 6 6M16 6l6 6-6 6M14 3l-4 18" />
    </>
  ),
  layers: (
    <>
      <path d="m12 3 10 5-10 5L2 8zM2 12l10 5 10-5M2 16l10 5 10-5" />
    </>
  ),
  check: <path d="m5 12 4 4L19 6" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M5 19l1.5-1.5M17.5 6.5 19 5" />
    </>
  ),
  moon: <path d="M20 14A8 8 0 0 1 10 4a8 8 0 1 0 10 10Z" />,
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  close: <path d="m6 6 12 12M6 18 18 6" />,
  download: (
    <>
      <path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5" />
    </>
  ),
  spark: <path d="m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3z" />,
  plus: <path d="M12 4v16M4 12h16" />,
};
export function Icon({
  name,
  className = "",
}: {
  name: IconName;
  className?: string;
}) {
  return (
    <svg
      className={`icon ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}
export function Button({
  variant = "primary",
  className = "",
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary";
}) {
  return (
    <button
      type={type}
      className={`button ${variant} ${className}`}
      {...props}
    />
  );
}
export function Badge({ children }: { children: ReactNode }) {
  return <span className="badge">{children}</span>;
}
export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`card ${className}`}>{children}</div>;
}
export function Field({
  label,
  help,
  error,
  id,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  help?: string;
  error?: string;
  id: string;
}) {
  const described =
    [help ? `${id}-help` : null, error ? `${id}-error` : null]
      .filter(Boolean)
      .join(" ") || undefined;
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        aria-invalid={!!error}
        aria-describedby={described}
        {...props}
      />
      {help && (
        <span id={`${id}-help`} className="field-help">
          {help}
        </span>
      )}
      {error && (
        <span id={`${id}-error`} className="field-error">
          {error}
        </span>
      )}
    </div>
  );
}
export function TextArea({
  label,
  error,
  id,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  error?: string;
  id: string;
}) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <textarea
        id={id}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        {...props}
      />
      {error && (
        <span id={`${id}-error`} className="field-error">
          {error}
        </span>
      )}
    </div>
  );
}
export function BrandLogo() {
  return (
    <span className="brand-logo">
      <img
        src="/brand/logos/kezuvio-horizontal-light.svg"
        width="450"
        height="112"
        alt="Kezuvio Labs"
        className="logo-light"
      />
      <img
        src="/brand/logos/kezuvio-horizontal-dark.svg"
        width="450"
        height="112"
        alt="Kezuvio Labs"
        className="logo-dark"
      />
    </span>
  );
}
