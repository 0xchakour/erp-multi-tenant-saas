export default function BrandLogo({
  size = 44,
  withWordmark = true,
  tone = "light",
  className = "",
  title = "Nexora ERP",
  subtitle = "Multi-tenant SaaS",
}) {
  return (
    <div
      className={`brand-logo ${withWordmark ? "brand-logo-with-copy" : "brand-logo-mark-only"} ${className}`.trim()}
    >
      <img
        src="/assets/logo-icon.svg"
        alt={withWordmark ? "" : title}
        loading="eager"
        decoding="async"
        width={size}
        height={size}
        style={{ width: size, height: size }}
        className={`brand-logo-mark brand-logo-mark-${tone}`}
      />

      {withWordmark ? (
        <div className={`brand-logo-copy brand-logo-copy-${tone}`}>
          <p className="brand-logo-title">{title}</p>
          <p className="brand-logo-subtitle">{subtitle}</p>
        </div>
      ) : null}
    </div>
  );
}
