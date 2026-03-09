import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import SaasLogo from "../marketing/SaasLogo";
import { useAuth } from "../../hooks/useAuth";
import { firstFieldError, normalizeApiError } from "../../services/error-utils";
import LegalConsentNotice from "../shared/LegalConsentNotice";
import ForgotPasswordFlow from "./ForgotPasswordFlow";

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

export default function AuthModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [activeTab, setActiveTab] = useState("signin");
  const [form, setForm] = useState(INITIAL_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isResetFlow, setIsResetFlow] = useState(false);

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
      setActiveTab("signin");
      setIsResetFlow(false);
      return;
    }

    setForm(INITIAL_FORM);
    setFormErrors({});
    setServerError("");
    setSubmitting(false);
    setIsPasswordVisible(false);
    setIsResetFlow(false);
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const emailError = firstFieldError(formErrors, "email");
  const passwordError = firstFieldError(formErrors, "password");

  const handleSignInSubmit = async (event) => {
    event.preventDefault();
    setServerError("");
    setFormErrors({});

    setSubmitting(true);

    try {
      await login(form);
      onClose();
      navigate("/dashboard", { replace: true });
    } catch (error) {
      const normalized = normalizeApiError(error);
      setServerError(normalized.message);
      setFormErrors(normalized.validationErrors);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGetStarted = () => {
    onClose();
    navigate("/onboarding");
  };

  return createPortal(
    <div
      className="mk-auth-modal-overlay"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section
        className="mk-auth-modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mk-auth-modal-title"
      >
        <button
          type="button"
          className="mk-auth-modal-close"
          onClick={onClose}
          aria-label="Close authentication modal"
        >
          &times;
        </button>

        <div className="mk-auth-modal-header">
          <div className="mk-auth-modal-brand">
            <SaasLogo compact withWordmark={false} />
          </div>

          <div className="mk-auth-modal-tabs" role="tablist" aria-label="Authentication options">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "signin"}
              className={`mk-auth-modal-tab ${activeTab === "signin" ? "is-active" : ""}`}
              onClick={() => {
                setActiveTab("signin");
                setIsResetFlow(false);
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "signup"}
              className={`mk-auth-modal-tab ${activeTab === "signup" ? "is-active" : ""}`}
              onClick={() => {
                setActiveTab("signup");
                setIsResetFlow(false);
              }}
            >
              Get Started
            </button>
          </div>
        </div>

        <div className="mk-auth-modal-body">
          {activeTab === "signin" ? (
            <div className="mk-auth-modal-content" key="signin">
              <div className="mk-auth-modal-inner">
                {isResetFlow ? (
                  <ForgotPasswordFlow
                    initialEmail={form.email}
                    onBackToSignIn={(email = "") => {
                      setIsResetFlow(false);
                      if (email) {
                        setForm((previous) => ({ ...previous, email }));
                      }
                    }}
                  />
                ) : (
                  <>
                    <h2 id="mk-auth-modal-title" className="mk-auth-modal-title">
                      Sign in to your workspace
                    </h2>
                    <p className="mk-auth-modal-subtitle">
                      Continue with your company credentials
                    </p>

                    {serverError ? (
                      <p className="mk-auth-modal-error" role="alert">
                        {serverError}
                      </p>
                    ) : null}

                    <form onSubmit={handleSignInSubmit} className="mk-auth-modal-form">
                      <div className="mk-auth-modal-field">
                        <label htmlFor="mk-auth-email">Email</label>
                        <input
                          id="mk-auth-email"
                          type="email"
                          className={`mk-auth-modal-input ${emailError ? "is-invalid" : ""}`}
                          placeholder="name@company.com"
                          autoComplete="email"
                          value={form.email}
                          onChange={(event) =>
                            setForm((previous) => ({ ...previous, email: event.target.value }))
                          }
                          required
                          autoFocus
                        />
                        {emailError ? (
                          <p className="mk-auth-modal-field-error">{emailError}</p>
                        ) : null}
                      </div>

                      <div className="mk-auth-modal-field">
                        <label htmlFor="mk-auth-password">Password</label>
                        <div className="mk-auth-modal-password-shell">
                          <input
                            id="mk-auth-password"
                            type={isPasswordVisible ? "text" : "password"}
                            className={`mk-auth-modal-input ${passwordError ? "is-invalid" : ""}`}
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
                            className="mk-auth-modal-password-toggle"
                            aria-label={isPasswordVisible ? "Hide password" : "Show password"}
                            aria-pressed={isPasswordVisible}
                            onClick={() => setIsPasswordVisible((visible) => !visible)}
                          >
                            <PasswordToggleIcon isVisible={isPasswordVisible} />
                          </button>
                        </div>
                        {passwordError ? (
                          <p className="mk-auth-modal-field-error">{passwordError}</p>
                        ) : null}
                      </div>

                      <button
                        type="submit"
                        className="mk-auth-modal-primary"
                        disabled={submitting}
                      >
                        {submitting ? "Signing in..." : "Sign In"}
                      </button>

                      <LegalConsentNotice
                        className="mk-auth-modal-legal"
                        linkClassName="mk-auth-modal-legal-link"
                      />
                    </form>

                    <a
                      href="#forgot-password"
                      className="mk-auth-modal-forgot"
                      onClick={(event) => {
                        event.preventDefault();
                        setServerError("");
                        setFormErrors({});
                        setIsResetFlow(true);
                      }}
                    >
                      Forgot your password?
                    </a>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="mk-auth-modal-content" key="signup">
              <div className="mk-auth-modal-inner">
                <h2 id="mk-auth-modal-title" className="mk-auth-modal-title">
                  Get started with your ERP workspace
                </h2>
                <p className="mk-auth-modal-subtitle">
                  Launch your tenant, invite your team, and configure billing in minutes
                </p>

                <div className="mk-auth-modal-signup-panel">
                  <ul className="mk-auth-modal-signup-list">
                    <li>Guided multi-tenant setup</li>
                    <li>Plan and billing configuration</li>
                    <li>Secure workspace provisioning</li>
                  </ul>

                  <button
                    type="button"
                    className="mk-auth-modal-primary"
                    onClick={handleGetStarted}
                  >
                    Continue Setup
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <button
          type="button"
          className="mk-auth-modal-cancel"
          onClick={onClose}
          disabled={submitting}
        >
          Cancel
        </button>
      </section>
    </div>,
    document.body
  );
}
