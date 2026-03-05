import { Link } from "react-router-dom";
import { limitLabel } from "../../utils/limitLabel";

function planPrice(plan, cycle) {
  const monthly = Number(plan.price ?? 0);

  if (monthly <= 0) {
    return "Free";
  }

  if (cycle === "yearly") {
    const yearly = monthly * 10;
    return `$${yearly.toFixed(0)} / year`;
  }

  return `$${monthly.toFixed(0)} / month`;
}

export default function PricingSection({
  plans,
  cycle,
  onCycleChange,
  loading,
  error,
}) {
  const sortedPlans = [...plans].sort((a, b) => Number(a.price ?? 0) - Number(b.price ?? 0));

  return (
    <section id="pricing" className="mk-section mk-pricing" aria-labelledby="mk-pricing-title">
      <div className="mk-container">
        <header className="mk-section-head mk-pricing-head">
          <p className="mk-section-kicker">Simple Pricing</p>
          <h2 id="mk-pricing-title">Choose the Plan That Matches Your Stage</h2>

          <div className="mk-billing-toggle" role="tablist" aria-label="Billing cycle">
            <button
              type="button"
              className={`mk-billing-option ${cycle === "monthly" ? "is-active" : ""}`.trim()}
              onClick={() => onCycleChange("monthly")}
            >
              Monthly
            </button>
            <button
              type="button"
              className={`mk-billing-option ${cycle === "yearly" ? "is-active" : ""}`.trim()}
              onClick={() => onCycleChange("yearly")}
            >
              Yearly
            </button>
          </div>
        </header>

        {loading ? <p className="mk-pricing-feedback">Loading plans...</p> : null}
        {!loading && error ? <p className="mk-pricing-feedback mk-pricing-error">{error}</p> : null}

        {!loading && !error ? (
          <div className="mk-pricing-grid">
            {sortedPlans.map((plan, index) => {
              const popular = plan.slug === "pro" || (!plan.slug && index === 1);

              return (
                <article
                  className={`mk-pricing-card ${popular ? "is-popular" : ""}`.trim()}
                  key={plan.id}
                >
                  {popular ? <span className="mk-popular-chip">Most Popular</span> : null}

                  <h3>{plan.name}</h3>
                  <p className="mk-pricing-value">{planPrice(plan, cycle)}</p>
                  {plan.description ? <p className="mk-pricing-description">{plan.description}</p> : null}

                  <ul className="mk-pricing-limits">
                    <li>Users: {limitLabel(plan.max_users)}</li>
                    <li>Clients: {limitLabel(plan.max_clients)}</li>
                    <li>Products: {limitLabel(plan.max_products)}</li>
                    <li>Invoices / month: {limitLabel(plan.max_invoices_per_month)}</li>
                  </ul>

                  <Link to={`/onboarding?plan=${plan.id}`} className="mk-btn mk-btn-primary mk-btn-block">
                    Select {plan.name}
                  </Link>
                </article>
              );
            })}
          </div>
        ) : null}
      </div>
    </section>
  );
}
