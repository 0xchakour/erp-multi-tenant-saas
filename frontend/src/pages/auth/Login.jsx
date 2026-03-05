import { Navigate, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { firstFieldError, normalizeApiError } from "../../services/error-utils";
import Button from "../../components/ui/Button";
import TextInput from "../../components/ui/TextInput";
import Alert from "../../components/ui/Alert";
import BrandLogo from "../../components/shared/BrandLogo";
import RecaptchaField from "../../components/shared/RecaptchaField";

export default function Login() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY ?? "";

  const [form, setForm] = useState({ email: "", password: "", company_name: "" });
  const [formErrors, setFormErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState("");
  const [recaptchaError, setRecaptchaError] = useState("");

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setServerError("");
    setFormErrors({});
    setRecaptchaError("");

    if (!recaptchaToken) {
      setRecaptchaError("Please confirm you are not a robot.");
      return;
    }

    setSubmitting(true);

    try {
      await login({
        ...form,
        recaptcha_token: recaptchaToken,
      });
      navigate("/dashboard", { replace: true });
    } catch (error) {
      const normalized = normalizeApiError(error);
      setServerError(normalized.message);
      setFormErrors(normalized.validationErrors);
      setRecaptchaToken("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-layout fade-in">
        <aside className="auth-brand-panel">
          <BrandLogo
            size={64}
            tone="dark"
            title="Nexora ERP"
            subtitle="Multi-tenant SaaS"
          />
          <h2>Modern ERP Workspace</h2>
          <p>
            Finance, billing, and tenant operations in one secure console.
          </p>
        </aside>

        <div className="auth-card">
          <p className="auth-kicker">Enterprise Login</p>
          <h1>Welcome Back</h1>
          <p className="auth-subtitle">
            Token authentication is enforced by Laravel Sanctum.
          </p>

          {serverError ? <Alert variant="danger">{serverError}</Alert> : null}

          <form onSubmit={handleSubmit} className="stack-md">
            <TextInput
              id="company-name"
              type="text"
              label="Company (optional)"
              placeholder="Required only if email exists in multiple tenants"
              value={form.company_name}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, company_name: event.target.value }))
              }
              error={firstFieldError(formErrors, "company_name")}
            />

            <TextInput
              id="email"
              type="email"
              label="Email"
              placeholder="name@company.com"
              autoComplete="email"
              value={form.email}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, email: event.target.value }))
              }
              error={firstFieldError(formErrors, "email")}
            />

            <TextInput
              id="password"
              type="password"
              label="Password"
              placeholder="Your password"
              autoComplete="current-password"
              value={form.password}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, password: event.target.value }))
              }
              error={firstFieldError(formErrors, "password")}
            />

            <RecaptchaField
              className="auth-recaptcha"
              siteKey={recaptchaSiteKey}
              token={recaptchaToken}
              onTokenChange={setRecaptchaToken}
              error={recaptchaError || firstFieldError(formErrors, "recaptcha_token")}
            />

            <Button type="submit" fullWidth loading={submitting} disabled={!recaptchaToken}>
              Sign In
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
