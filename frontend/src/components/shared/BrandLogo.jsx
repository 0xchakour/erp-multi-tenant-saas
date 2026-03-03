import { useId } from "react";

export default function BrandLogo({
  size = 44,
  withWordmark = true,
  tone = "light",
  className = "",
  title = "Tenant ERP",
  subtitle = "Multi-tenant SaaS",
}) {
  const rawId = useId();
  const safeId = rawId.replace(/[:]/g, "");
  const gradientA = `brand-gradient-a-${safeId}`;
  const gradientB = `brand-gradient-b-${safeId}`;
  const glow = `brand-glow-${safeId}`;

  return (
    <div
      className={`brand-logo ${withWordmark ? "brand-logo-with-copy" : "brand-logo-mark-only"} ${className}`.trim()}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        role="img"
        aria-label={title}
        className={`brand-logo-mark brand-logo-mark-${tone}`}
      >
        <defs>
          <linearGradient id={gradientA} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0ea5a4" />
            <stop offset="100%" stopColor="#155e75" />
          </linearGradient>
          <linearGradient id={gradientB} x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#f97316" />
          </linearGradient>
          <filter id={glow} x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="4" stdDeviation="3" floodOpacity="0.2" />
          </filter>
        </defs>

        <rect
          x="8"
          y="8"
          width="48"
          height="48"
          rx="16"
          fill={`url(#${gradientA})`}
          filter={`url(#${glow})`}
        />
        <path
          d="M20 19h10l8 8-8 8H20l8-8-8-8Zm14 10h10l8 8-8 8H34l8-8-8-8Z"
          fill="rgba(255,255,255,0.92)"
        />
        <circle cx="50" cy="14" r="6" fill={`url(#${gradientB})`} />
      </svg>

      {withWordmark ? (
        <div className={`brand-logo-copy brand-logo-copy-${tone}`}>
          <p className="brand-logo-title">{title}</p>
          <p className="brand-logo-subtitle">{subtitle}</p>
        </div>
      ) : null}
    </div>
  );
}
