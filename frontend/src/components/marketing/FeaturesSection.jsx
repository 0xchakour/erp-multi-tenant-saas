import { FEATURE_ITEMS } from "../../marketing/brand";

function FeatureIcon({ id }) {
  if (id === "automation") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 6h16v4H4V6Zm0 8h10v4H4v-4Zm12 0h4v4h-4v-4Z" />
      </svg>
    );
  }

  if (id === "visibility") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3 20V4h2v14h16v2H3Zm4-4V9h3v7H7Zm5 0V6h3v10h-3Zm5 0v-5h3v5h-3Z" />
      </svg>
    );
  }

  if (id === "tenancy") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 2 3 7v10l9 5 9-5V7l-9-5Zm0 2.3 6.8 3.8L12 11.9 5.2 8.1 12 4.3Zm-7 5.4 6 3.4v6.7l-6-3.3V9.7Zm8 10.1v-6.7l6-3.4v6.8l-6 3.3Z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2 4 6v6c0 5 3.4 9.7 8 11 4.6-1.3 8-6 8-11V6l-8-4Zm0 2.2L18 7v5c0 3.9-2.5 7.7-6 9-3.5-1.3-6-5.1-6-9V7l6-2.8Z" />
    </svg>
  );
}

export default function FeaturesSection() {
  return (
    <section id="features" className="mk-section mk-features" aria-labelledby="mk-features-title">
      <div className="mk-container">
        <header className="mk-section-head">
          <p className="mk-section-kicker">Platform Capabilities</p>
          <h2 id="mk-features-title">Built for SaaS Operators, Not Just Accountants</h2>
        </header>

        <div className="mk-feature-grid">
          {FEATURE_ITEMS.map((feature) => (
            <article className="mk-feature-card" key={feature.id}>
              <div className="mk-feature-icon">
                <FeatureIcon id={feature.id} />
              </div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
