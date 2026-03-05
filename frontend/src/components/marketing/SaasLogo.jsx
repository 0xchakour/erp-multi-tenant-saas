import { BRAND } from "../../marketing/brand";

export default function SaasLogo({ withWordmark = true, compact = false }) {
  const logoTitle = `${BRAND.name} ERP`;

  return (
    <div
      className={`mk-logo ${compact ? "mk-logo-compact" : ""}`.trim()}
      role="img"
      aria-label={logoTitle}
    >
      <img className="mk-logo-mark" src="/assets/logo-icon.svg" alt="" loading="eager" decoding="async" />

      {withWordmark ? (
        <div className="mk-logo-copy">
          <p className="mk-logo-title">{logoTitle}</p>
          <p className="mk-logo-subtitle">Multi-tenant ERP</p>
        </div>
      ) : null}
    </div>
  );
}
