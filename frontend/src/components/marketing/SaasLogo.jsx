import { BRAND } from "../../marketing/brand";

export default function SaasLogo({ withWordmark = true, compact = false }) {
  return (
    <div className={`mk-logo ${compact ? "mk-logo-compact" : ""}`.trim()}>
      <svg
        className="mk-logo-mark"
        viewBox="0 0 72 72"
        aria-label={`${BRAND.name} logo`}
        role="img"
      >
        <defs>
          <linearGradient id="mk-logo-core" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--mk-primary-500)" />
            <stop offset="100%" stopColor="var(--mk-primary-700)" />
          </linearGradient>
          <linearGradient id="mk-logo-accent" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="var(--mk-accent-400)" />
            <stop offset="100%" stopColor="var(--mk-accent-600)" />
          </linearGradient>
        </defs>

        <rect
          x="8"
          y="8"
          width="56"
          height="56"
          rx="18"
          fill="url(#mk-logo-core)"
          className="mk-logo-core"
        />
        <path
          d="M22 24h10l9 9-9 9H22l9-9-9-9Zm17 8h11l8 8-8 8H39l8-8-8-8Z"
          fill="rgba(255,255,255,0.95)"
        />
        <circle cx="55" cy="17" r="6" fill="url(#mk-logo-accent)" />
      </svg>

      {withWordmark ? (
        <div className="mk-logo-copy">
          <p className="mk-logo-title">{BRAND.name}</p>
          <p className="mk-logo-subtitle">Multi-tenant ERP</p>
        </div>
      ) : null}
    </div>
  );
}
