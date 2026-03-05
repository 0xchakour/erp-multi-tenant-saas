import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import PageSection from "../../components/shared/PageSection";
import Alert from "../../components/ui/Alert";
import Button from "../../components/ui/Button";
import Spinner from "../../components/ui/Spinner";
import EmptyState from "../../components/ui/EmptyState";
import {
  createBillingCheckoutSession,
  createBillingPortalSession,
  getBillingStatus,
} from "../../services/billing.service";
import { normalizeApiError } from "../../services/error-utils";
import { useAuth } from "../../hooks/useAuth";

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(Number(value ?? 0));
}

function formatPlanPrice(plan) {
  const price = Number(plan?.price ?? 0);

  if (price <= 0) {
    return "Free";
  }

  const interval = plan?.billing_interval === "year" ? "year" : "month";
  return `${formatCurrency(price)} / ${interval}`;
}

function limitLabel(limit) {
  if (limit === null || limit >= 9999) {
    return "Unlimited";
  }
  return String(limit);
}

export default function Billing() {
  const { isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [billing, setBilling] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");
  const [planLoadingId, setPlanLoadingId] = useState(null);
  const [openingPortal, setOpeningPortal] = useState(false);

  const loadBilling = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await getBillingStatus();
      setBilling(response);
    } catch (requestError) {
      setError(normalizeApiError(requestError).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBilling();
  }, [loadBilling]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const checkoutStatus = params.get("checkout");

    if (!checkoutStatus) {
      return;
    }

    if (checkoutStatus === "success") {
      setActionSuccess("Checkout completed. Billing status has been refreshed.");
      loadBilling();
    }

    if (checkoutStatus === "cancel") {
      setActionError("Checkout was canceled.");
    }

    navigate("/billing", { replace: true });
  }, [location.search, navigate, loadBilling]);

  const plans = billing?.available_plans ?? [];
  const events = billing?.events ?? [];
  const company = billing?.company;
  const currentPlan = billing?.plan;
  const stripeConfigured = Boolean(billing?.stripe_configured);
  const canManageBilling = Boolean(billing?.can_manage_billing) && isAdmin;

  const usageRows = useMemo(
    () => {
      const usage = billing?.usage ?? {};

      return [
        { key: "users", label: "Users", value: usage?.users },
        { key: "clients", label: "Clients", value: usage?.clients },
        { key: "products", label: "Products", value: usage?.products },
        {
          key: "invoices_this_month",
          label: "Invoices (This Month)",
          value: usage?.invoices_this_month,
        },
      ];
    },
    [billing]
  );

  const handlePlanSelect = async (plan) => {
    if (!canManageBilling) {
      return;
    }

    setPlanLoadingId(plan.id);
    setActionError("");
    setActionSuccess("");

    try {
      const result = await createBillingCheckoutSession({
        plan_id: plan.id,
        success_url: `${window.location.origin}/billing?checkout=success`,
        cancel_url: `${window.location.origin}/billing?checkout=cancel`,
      });

      if (result?.mode === "stripe_checkout" && result?.url) {
        window.location.assign(result.url);
        return;
      }

      setActionSuccess(result?.message ?? "Plan updated.");
      await loadBilling();
    } catch (requestError) {
      setActionError(normalizeApiError(requestError).message);
    } finally {
      setPlanLoadingId(null);
    }
  };

  const handlePortal = async () => {
    if (!canManageBilling) {
      return;
    }

    setOpeningPortal(true);
    setActionError("");
    setActionSuccess("");

    try {
      const result = await createBillingPortalSession({
        return_url: window.location.href,
      });

      if (!result?.url) {
        throw new Error("Billing portal URL is missing.");
      }

      window.location.assign(result.url);
    } catch (requestError) {
      setActionError(normalizeApiError(requestError).message);
      setOpeningPortal(false);
    }
  };

  return (
    <div className="stack-lg fade-in">
      <PageSection
        title="Billing & Subscription"
        description="Current plan status, usage limits, and Stripe-powered upgrades."
        actions={
          canManageBilling ? (
            <Button
              variant="ghost"
              onClick={handlePortal}
              loading={openingPortal}
              disabled={!company?.stripe_customer_id || !stripeConfigured}
            >
              Manage in Stripe
            </Button>
          ) : null
        }
      >
        {loading ? <Spinner label="Loading billing status..." /> : null}
        {!loading && error ? <Alert variant="danger">{error}</Alert> : null}
        {actionError ? <Alert variant="danger">{actionError}</Alert> : null}
        {actionSuccess ? <Alert variant="success">{actionSuccess}</Alert> : null}

        {!loading && !error && billing ? (
          <div className="billing-summary-grid">
            <article className="billing-summary-card">
              <p className="billing-summary-label">Current Plan</p>
              <p className="billing-summary-value">{currentPlan?.name ?? "Unknown"}</p>
              <p className="billing-summary-meta">{formatPlanPrice(currentPlan)}</p>
            </article>
            <article className="billing-summary-card">
              <p className="billing-summary-label">Billing Status</p>
              <p className="billing-summary-value">{company?.billing_status ?? "unknown"}</p>
              <p className="billing-summary-meta">
                Active: {company?.is_active ? "Yes" : "No"}
              </p>
            </article>
            <article className="billing-summary-card">
              <p className="billing-summary-label">Trial Ends</p>
              <p className="billing-summary-value">{company?.trial_ends_at ?? "-"}</p>
              <p className="billing-summary-meta">
                Subscription End: {company?.subscription_ends_at ?? "-"}
              </p>
            </article>
          </div>
        ) : null}
      </PageSection>

      <PageSection
        title="Usage"
        description="Real-time usage against your current subscription limits."
      >
        {!loading && !error ? (
          <div className="usage-stack">
            {usageRows.map((row) => {
              const value = row.value ?? {};
              const percent = value.usage_percent ?? 0;
              const displayPercent = value.is_unlimited ? null : Math.max(0, Math.min(percent, 100));

              return (
                <article className="usage-row" key={row.key}>
                  <div className="usage-row-header">
                    <p className="usage-row-title">{row.label}</p>
                    <p className="usage-row-values">
                      {value.current ?? 0} / {value.is_unlimited ? "Unlimited" : value.limit ?? 0}
                    </p>
                  </div>
                  {displayPercent === null ? (
                    <p className="usage-row-meta">Unlimited under your current plan.</p>
                  ) : (
                    <>
                      <div className="usage-bar">
                        <span style={{ width: `${displayPercent}%` }} />
                      </div>
                      <p className="usage-row-meta">{displayPercent}% used</p>
                    </>
                  )}
                </article>
              );
            })}
          </div>
        ) : null}
      </PageSection>

      <PageSection
        title="Upgrade or Downgrade"
        description="Select a plan. Paid plans open Stripe Checkout; existing subscriptions can be managed in Stripe Portal."
      >
        {!canManageBilling ? (
          <Alert variant="warning">Only admin users can manage subscription billing.</Alert>
        ) : null}

        {canManageBilling && !stripeConfigured ? (
          <Alert variant="warning">
            Stripe is not configured in backend environment. Only free-plan switches are available.
          </Alert>
        ) : null}

        {!loading && !error ? (
          <div className="plan-grid">
            {plans.map((plan) => {
              const isCurrent = currentPlan?.id === plan.id;
              const disablePaidPlan = Number(plan.price ?? 0) > 0 && !stripeConfigured;

              return (
                <article
                  key={plan.id}
                  className={`plan-card ${isCurrent ? "plan-card-current" : ""}`.trim()}
                >
                  <p className="plan-name">{plan.name}</p>
                  <p className="plan-price">{formatPlanPrice(plan)}</p>
                  {plan.description ? <p className="plan-description">{plan.description}</p> : null}

                  <div className="plan-limits">
                    <p>Users: {limitLabel(plan.max_users)}</p>
                    <p>Clients: {limitLabel(plan.max_clients)}</p>
                    <p>Products: {limitLabel(plan.max_products)}</p>
                    <p>Invoices / Month: {limitLabel(plan.max_invoices_per_month)}</p>
                  </div>

                  <Button
                    onClick={() => handlePlanSelect(plan)}
                    loading={planLoadingId === plan.id}
                    disabled={isCurrent || !canManageBilling || disablePaidPlan}
                  >
                    {isCurrent ? "Current Plan" : Number(plan.price ?? 0) > 0 ? "Upgrade" : "Downgrade"}
                  </Button>
                </article>
              );
            })}
          </div>
        ) : null}
      </PageSection>

      <PageSection
        title="Billing History"
        description="Stripe and internal billing events for your tenant."
      >
        {!loading && !error ? (
          events.length ? (
            <div className="table-shell">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Event</th>
                    <th>Status</th>
                    <th>Provider</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((event) => (
                    <tr key={event.id}>
                      <td>{event.occurred_at ?? event.created_at}</td>
                      <td>{event.event_type}</td>
                      <td>{event.status || "-"}</td>
                      <td>{event.provider}</td>
                      <td>
                        {event.amount === null ? "-" : formatCurrency(event.amount)}{" "}
                        {event.currency || ""}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              title="No billing events yet"
              description="Events will appear here after checkout, invoices, and subscription updates."
            />
          )
        ) : null}
      </PageSection>
    </div>
  );
}
