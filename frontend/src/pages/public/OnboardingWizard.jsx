import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { listPublicPlans } from "../../services/public.service";
import { firstFieldError, normalizeApiError } from "../../services/error-utils";
import { useAuth } from "../../hooks/useAuth";
import SaasLogo from "../../components/marketing/SaasLogo";

const STEPS = [
  "Choose Plan",
  "Company",
  "Admin Account",
  "Review",
];

function parsePlanId(search) {
  const params = new URLSearchParams(search);
  const value = Number(params.get("plan"));
  return Number.isFinite(value) && value > 0 ? value : null;
}

export default function OnboardingWizard() {
  const location = useLocation();
  const navigate = useNavigate();
  const { register, isAuthenticated, loading: authLoading } = useAuth();

  const queryPlanId = useMemo(() => parsePlanId(location.search), [location.search]);

  const [plans, setPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [step, setStep] = useState(0);
  const [selectedPlanId, setSelectedPlanId] = useState(queryPlanId);
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState(false);
  const [serverError, setServerError] = useState("");
  const [validationErrors, setValidationErrors] = useState({});

  const [form, setForm] = useState({
    company_name: "",
    name: "",
    email: "",
    password: "",
    confirm_password: "",
  });

  useEffect(() => {
    let mounted = true;

    const loadPlans = async () => {
      setPlansLoading(true);

      try {
        const rows = await listPublicPlans();

        if (!mounted) {
          return;
        }

        setPlans(rows);

        if (rows.length > 0) {
          const hasQueryPlan =
            queryPlanId && rows.some((plan) => plan.id === Number(queryPlanId));

          setSelectedPlanId((current) => {
            if (current && rows.some((plan) => plan.id === Number(current))) {
              return current;
            }

            if (hasQueryPlan) {
              return queryPlanId;
            }

            return rows[0].id;
          });
        }
      } catch {
        if (mounted) {
          setPlans([]);
          setServerError("Unable to load plans right now. Please try again.");
        }
      } finally {
        if (mounted) {
          setPlansLoading(false);
        }
      }
    };

    loadPlans();

    return () => {
      mounted = false;
    };
  }, [queryPlanId]);

  useEffect(() => {
    if (created) {
      const timer = window.setTimeout(() => {
        navigate("/dashboard", { replace: true });
      }, 900);

      return () => window.clearTimeout(timer);
    }

    return undefined;
  }, [created, navigate]);

  if (!authLoading && isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const selectedPlan = plans.find((plan) => plan.id === Number(selectedPlanId));
  const progress = ((step + 1) / STEPS.length) * 100;

  const validateStep = () => {
    if (step === 0) {
      if (!selectedPlanId) {
        setServerError("Select a plan to continue.");
        return false;
      }
      return true;
    }

    if (step === 1) {
      if (!form.company_name.trim()) {
        setValidationErrors({ company_name: ["Company name is required."] });
        return false;
      }
      return true;
    }

    if (step === 2) {
      const nextErrors = {};

      if (!form.name.trim()) {
        nextErrors.name = ["Admin name is required."];
      }

      if (!form.email.trim()) {
        nextErrors.email = ["Email is required."];
      }

      if (!form.password) {
        nextErrors.password = ["Password is required."];
      }

      if (form.password && form.password.length < 8) {
        nextErrors.password = ["Password must be at least 8 characters."];
      }

      if (form.password !== form.confirm_password) {
        nextErrors.confirm_password = ["Passwords do not match."];
      }

      if (Object.keys(nextErrors).length > 0) {
        setValidationErrors(nextErrors);
        return false;
      }

      return true;
    }

    return true;
  };

  const handleNext = () => {
    setServerError("");
    setValidationErrors({});

    if (!validateStep()) {
      return;
    }

    setStep((current) => Math.min(current + 1, STEPS.length - 1));
  };

  const handleBack = () => {
    setServerError("");
    setValidationErrors({});
    setStep((current) => Math.max(current - 1, 0));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setServerError("");
    setValidationErrors({});

    if (!validateStep()) {
      return;
    }

    setCreating(true);

    try {
      await register({
        company_name: form.company_name.trim(),
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        subscription_plan_id: selectedPlanId || undefined,
      });
      setCreated(true);
    } catch (requestError) {
      const normalized = normalizeApiError(requestError);
      setServerError(normalized.message);
      setValidationErrors(normalized.validationErrors ?? {});
      setCreating(false);
    }
  };

  return (
    <main className="mk-onboarding">
      <section className="mk-onboarding-shell">
        <header className="mk-onboarding-header">
          <SaasLogo />
          <p>Create your workspace in a few guided steps.</p>
        </header>

        <div className="mk-onboarding-progress" aria-label="Onboarding progress">
          <div
            className="mk-progress-track"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress)}
            aria-valuetext={`${Math.round(progress)}% completed`}
          >
            <span className={`mk-progress-fill mk-progress-${step + 1}`.trim()} />
          </div>
          <ol>
            {STEPS.map((label, index) => (
              <li key={label} className={index <= step ? "is-active" : ""}>
                <span>{index + 1}</span>
                {label}
              </li>
            ))}
          </ol>
        </div>

        <form className="mk-onboarding-form" onSubmit={handleSubmit}>
          {serverError ? <p className="mk-onboarding-error">{serverError}</p> : null}

          {!creating && !created ? (
            <div className="mk-onboarding-panel" key={`step-${step}`}>
              {step === 0 ? (
                <>
                  <h2>Select Your Plan</h2>
                  <p>Start with a plan and change anytime from billing settings.</p>
                  <div className="mk-onboarding-plan-grid">
                    {plansLoading ? <p>Loading plans...</p> : null}
                    {!plansLoading
                      ? plans.map((plan) => (
                          <button
                            key={plan.id}
                            type="button"
                            className={`mk-onboarding-plan ${
                              Number(selectedPlanId) === plan.id ? "is-selected" : ""
                            }`.trim()}
                            onClick={() => setSelectedPlanId(plan.id)}
                          >
                            <strong>{plan.name}</strong>
                            <span>
                              {Number(plan.price ?? 0) <= 0
                                ? "Free"
                                : `$${Number(plan.price).toFixed(0)} / ${
                                    plan.billing_interval === "year" ? "year" : "month"
                                  }`}
                            </span>
                          </button>
                        ))
                      : null}
                  </div>
                </>
              ) : null}

              {step === 1 ? (
                <>
                  <h2>Company Details</h2>
                  <label htmlFor="company_name">Company Name</label>
                  <input
                    id="company_name"
                    className={`mk-onboarding-input ${
                      firstFieldError(validationErrors, "company_name") ? "has-error" : ""
                    }`.trim()}
                    value={form.company_name}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, company_name: event.target.value }))
                    }
                    placeholder="Acme Technologies"
                  />
                  {firstFieldError(validationErrors, "company_name") ? (
                    <p className="mk-onboarding-field-error">
                      {firstFieldError(validationErrors, "company_name")}
                    </p>
                  ) : null}
                </>
              ) : null}

              {step === 2 ? (
                <>
                  <h2>Admin Account</h2>
                  <label htmlFor="name">Full Name</label>
                  <input
                    id="name"
                    className={`mk-onboarding-input ${
                      firstFieldError(validationErrors, "name") ? "has-error" : ""
                    }`.trim()}
                    value={form.name}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, name: event.target.value }))
                    }
                    placeholder="Jane Doe"
                  />
                  {firstFieldError(validationErrors, "name") ? (
                    <p className="mk-onboarding-field-error">
                      {firstFieldError(validationErrors, "name")}
                    </p>
                  ) : null}

                  <label htmlFor="email">Work Email</label>
                  <input
                    id="email"
                    type="email"
                    className={`mk-onboarding-input ${
                      firstFieldError(validationErrors, "email") ? "has-error" : ""
                    }`.trim()}
                    value={form.email}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, email: event.target.value }))
                    }
                    placeholder="you@company.com"
                  />
                  {firstFieldError(validationErrors, "email") ? (
                    <p className="mk-onboarding-field-error">
                      {firstFieldError(validationErrors, "email")}
                    </p>
                  ) : null}

                  <label htmlFor="password">Password</label>
                  <input
                    id="password"
                    type="password"
                    className={`mk-onboarding-input ${
                      firstFieldError(validationErrors, "password") ? "has-error" : ""
                    }`.trim()}
                    value={form.password}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, password: event.target.value }))
                    }
                    placeholder="Minimum 8 characters"
                  />
                  {firstFieldError(validationErrors, "password") ? (
                    <p className="mk-onboarding-field-error">
                      {firstFieldError(validationErrors, "password")}
                    </p>
                  ) : null}

                  <label htmlFor="confirm_password">Confirm Password</label>
                  <input
                    id="confirm_password"
                    type="password"
                    className={`mk-onboarding-input ${
                      firstFieldError(validationErrors, "confirm_password") ? "has-error" : ""
                    }`.trim()}
                    value={form.confirm_password}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, confirm_password: event.target.value }))
                    }
                    placeholder="Repeat password"
                  />
                  {firstFieldError(validationErrors, "confirm_password") ? (
                    <p className="mk-onboarding-field-error">
                      {firstFieldError(validationErrors, "confirm_password")}
                    </p>
                  ) : null}
                </>
              ) : null}

              {step === 3 ? (
                <>
                  <h2>Review and Create Workspace</h2>
                  <div className="mk-onboarding-review">
                    <p>
                      <strong>Plan:</strong> {selectedPlan?.name ?? "Not selected"}
                    </p>
                    <p>
                      <strong>Company:</strong> {form.company_name || "-"}
                    </p>
                    <p>
                      <strong>Admin:</strong> {form.name || "-"}
                    </p>
                    <p>
                      <strong>Email:</strong> {form.email || "-"}
                    </p>
                  </div>
                </>
              ) : null}
            </div>
          ) : null}

          {creating ? (
            <div className="mk-create-state" aria-live="polite">
              <span className="mk-create-spinner" />
              <p>Creating your company workspace...</p>
            </div>
          ) : null}

          {created ? (
            <div className="mk-create-state mk-create-success" aria-live="polite">
              <span className="mk-create-check">OK</span>
              <p>Workspace created. Redirecting to dashboard...</p>
            </div>
          ) : null}

          {!creating && !created ? (
            <div className="mk-onboarding-actions">
              <button
                type="button"
                className="mk-btn mk-btn-ghost"
                onClick={handleBack}
                disabled={step === 0}
              >
                Back
              </button>

              {step < STEPS.length - 1 ? (
                <button type="button" className="mk-btn mk-btn-primary" onClick={handleNext}>
                  Continue
                </button>
              ) : (
                <button type="submit" className="mk-btn mk-btn-primary">
                  Create Company
                </button>
              )}
            </div>
          ) : null}
        </form>
      </section>
    </main>
  );
}
