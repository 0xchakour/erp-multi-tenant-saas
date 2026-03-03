import { SECURITY_BADGES, TESTIMONIALS, TRUST_LOGOS } from "../../marketing/brand";

export default function TrustSection() {
  return (
    <section id="trust" className="mk-section mk-trust" aria-labelledby="mk-trust-title">
      <div className="mk-container">
        <header className="mk-section-head">
          <p className="mk-section-kicker">Trusted by Operators</p>
          <h2 id="mk-trust-title">Built for Reliability, Security, and Scale</h2>
        </header>

        <div className="mk-logo-cloud" aria-label="Enterprise customer logos">
          {TRUST_LOGOS.map((logo) => (
            <div className="mk-logo-pill" key={logo}>
              {logo}
            </div>
          ))}
        </div>

        <div className="mk-testimonial-grid">
          {TESTIMONIALS.map((item) => (
            <article className="mk-testimonial-card" key={item.author}>
              <p className="mk-testimonial-quote">"{item.quote}"</p>
              <p className="mk-testimonial-author">{item.author}</p>
              <p className="mk-testimonial-role">{item.role}</p>
            </article>
          ))}
        </div>

        <div className="mk-security-row">
          {SECURITY_BADGES.map((badge) => (
            <span className="mk-security-badge" key={badge}>
              {badge}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
