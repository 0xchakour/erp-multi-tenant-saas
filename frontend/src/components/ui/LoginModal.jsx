import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import SaasLogo from "../marketing/SaasLogo";
import { useAuth } from "../../hooks/useAuth";
import { firstFieldError, normalizeApiError } from "../../services/error-utils";
import RecaptchaField from "../shared/RecaptchaField";

const INITIAL_FORM = {
  email: "",
  password: "",
  company_name: "",
};

function PasswordToggleIcon({ isVisible }) {
  if (isVisible) {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3.2 3.2a1 1 0 0 1 1.4 0l16.2 16.2a1 1 0 0 1-1.4 1.4l-2.7-2.7a11.9 11.9 0 0 1-4.7.9c-5.9 0-10-4.8-11.3-6.7a1.9 1.9 0 0 1 0-2.2 20 20 0 0 1 5.4-5.3l-2.7-2.7a1 1 0 0 1 0-1.4Zm9.8 5.8a3.5 3.5 0 0 1 2.7 2.7L13 9Zm-3.6 3.6a3.5 3.5 0 0 0 4 4L9.4 12.6Zm8.8 1.8-2-2a5.5 5.5 0 0 0-7.6-7.6l-2-2A11.6 11.6 0 0 1 12 5c5.9 0 10 4.8 11.3 6.7a1.9 1.9 0 0 1 0 2.2c-.8 1.2-2.7 3.4-5.1 5Z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 5c5.9 0 10 4.8 11.3 6.7a1.9 1.9 0 0 1 0 2.2C22 15.8 17.9 20.6 12 20.6S2 15.8.7 13.9a1.9 1.9 0 0 1 0-2.2C2 9.8 6.1 5 12 5Zm0 2C7.4 7 3.9 10.8 2.4 12.8 3.9 14.8 7.4 18.6 12 18.6s8.1-3.8 9.6-5.8C20.1 10.8 16.6 7 12 7Zm0 2.1a3.7 3.7 0 1 1 0 7.4 3.7 3.7 0 0 1 0-7.4Zm0 2a1.7 1.7 0 1 0 0 3.4 1.7 1.7 0 0 0 0-3.4Z" />
    </svg>
  );
}

export default function LoginModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const { login } = useAuth();
  const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY ?? "";

  const [form, setForm] = useState(INITIAL_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState("");
  const [recaptchaError, setRecaptchaError] = useState("");

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      return;
    }

    setForm(INITIAL_FORM);
    setFormErrors({});
    setServerError("");
    setSubmitting(false);
    setIsPasswordVisible(false);
    setRecaptchaToken("");
    setRecaptchaError("");
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const emailError = firstFieldError(formErrors, "email");
  const passwordError = firstFieldError(formErrors, "password");

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
      onClose();
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

  return createPortal(
    <div
      className="mk-login-modal-overlay"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section
        className="mk-login-modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mk-login-modal-title"
      >
        <button
          type="button"
          className="mk-login-modal-close"
          onClick={onClose}
          aria-label="Close sign in modal"
        >
          <span aria-hidden="true">&times;</span>
        </button>

        <div className="mk-login-modal-brand">
          <SaasLogo compact withWordmark={false} />
        </div>

        <h2 id="mk-login-modal-title" className="mk-login-modal-title">
          Sign in to your workspace
        </h2>

        <p className="mk-login-modal-subtitle">
          Continue with your company credentials
        </p>

        {serverError ? (
          <p className="mk-login-modal-error" role="alert">
            {serverError}
          </p>
        ) : null}

        <form onSubmit={handleSubmit} className="mk-login-modal-form">
          <label className="mk-login-modal-field" htmlFor="mk-login-email">
            <span>Email</span>
            <input
              id="mk-login-email"
              type="email"
              className={`mk-login-modal-input ${emailError ? "is-invalid" : ""}`}
              placeholder="name@company.com"
              autoComplete="email"
              value={form.email}
              onChange={(event) =>
                setForm((previous) => ({ ...previous, email: event.target.value }))
              }
              required
              autoFocus
            />
          </label>

          {emailError ? <p className="mk-login-modal-field-error">{emailError}</p> : null}

          <label className="mk-login-modal-field" htmlFor="mk-login-password">
            <span>Password</span>
            <div className="mk-login-modal-password-shell">
              <input
                id="mk-login-password"
                type={isPasswordVisible ? "text" : "password"}
                className={`mk-login-modal-input mk-login-modal-input-password ${
                  passwordError ? "is-invalid" : ""
                }`}
                placeholder="Your password"
                autoComplete="current-password"
                value={form.password}
                onChange={(event) =>
                  setForm((previous) => ({ ...previous, password: event.target.value }))
                }
                required
              />

              <button
                type="button"
                className="mk-login-modal-password-toggle"
                aria-label={isPasswordVisible ? "Hide password" : "Show password"}
                aria-pressed={isPasswordVisible}
                onClick={() => setIsPasswordVisible((visible) => !visible)}
              >
                <PasswordToggleIcon isVisible={isPasswordVisible} />
              </button>
            </div>
          </label>

          {passwordError ? <p className="mk-login-modal-field-error">{passwordError}</p> : null}

          <RecaptchaField
            className="mk-login-modal-recaptcha"
            siteKey={recaptchaSiteKey}
            theme="dark"
            token={recaptchaToken}
            onTokenChange={setRecaptchaToken}
            error={recaptchaError || firstFieldError(formErrors, "recaptcha_token")}
          />

          <div className="mk-login-modal-actions">
            <button
              type="submit"
              className="mk-login-modal-primary"
              disabled={submitting || !recaptchaToken}
            >
              {submitting ? "Signing in..." : "Login"}
            </button>

            <button
              type="button"
              className="mk-login-modal-secondary"
              onClick={onClose}
              disabled={submitting}
            >
              Back
            </button>
          </div>
        </form>

        <a
          href="#forgot-password"
          className="mk-login-modal-forgot"
          onClick={(event) => event.preventDefault()}
        >
          Forgot password?
        </a>
      </section>
    </div>,
    document.body
  );
}
