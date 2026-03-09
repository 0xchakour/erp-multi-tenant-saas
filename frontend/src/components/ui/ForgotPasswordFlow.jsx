import { useState } from "react";
import * as authService from "../../services/auth.service";
import { firstFieldError, normalizeApiError } from "../../services/error-utils";

const STEPS = Object.freeze({
  email: "email",
  code: "code",
  password: "password",
  success: "success",
});

export default function ForgotPasswordFlow({ initialEmail = "", onBackToSignIn }) {
  const [step, setStep] = useState(STEPS.email);
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formErrors, setFormErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [sendingCode, setSendingCode] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);

  const clearFeedback = () => {
    setFormErrors({});
    setServerError("");
    setInfoMessage("");
  };

  const handleSendCode = async (event) => {
    event.preventDefault();
    clearFeedback();
    setSendingCode(true);

    try {
      const response = await authService.forgotPassword({ email });
      setInfoMessage(response.message ?? "Verification code sent to your email.");
      setStep(STEPS.code);
    } catch (error) {
      const normalized = normalizeApiError(error);
      setServerError(normalized.message);
      setFormErrors(normalized.validationErrors);
    } finally {
      setSendingCode(false);
    }
  };

  const handleVerifyCode = async (event) => {
    event.preventDefault();
    clearFeedback();
    setVerifyingCode(true);

    try {
      const response = await authService.verifyResetCode({ email, code });
      setInfoMessage(response.message ?? "Verification code is valid.");
      setStep(STEPS.password);
    } catch (error) {
      const normalized = normalizeApiError(error);
      setServerError(normalized.message);
      setFormErrors(normalized.validationErrors);
    } finally {
      setVerifyingCode(false);
    }
  };

  const handleResetPassword = async (event) => {
    event.preventDefault();
    clearFeedback();
    setResettingPassword(true);

    try {
      const response = await authService.resetPassword({
        email,
        code,
        new_password: newPassword,
        new_password_confirmation: confirmPassword,
      });
      setSuccessMessage(response.message ?? "Password updated successfully. You can now sign in.");
      setStep(STEPS.success);
    } catch (error) {
      const normalized = normalizeApiError(error);
      setServerError(normalized.message);
      setFormErrors(normalized.validationErrors);
    } finally {
      setResettingPassword(false);
    }
  };

  const emailError = firstFieldError(formErrors, "email");
  const codeError = firstFieldError(formErrors, "code");
  const newPasswordError = firstFieldError(formErrors, "new_password");
  const newPasswordConfirmError = firstFieldError(formErrors, "new_password_confirmation");

  if (step === STEPS.success) {
    return (
      <>
        <h2 id="mk-auth-modal-title" className="mk-auth-modal-title">
          Password Updated
        </h2>
        <p className="mk-auth-modal-subtitle">Your credentials have been reset securely.</p>
        <p className="mk-auth-modal-success" role="status">
          {successMessage}
        </p>
        <button
          type="button"
          className="mk-auth-modal-primary"
          onClick={() => onBackToSignIn?.(email)}
        >
          Back to Sign In
        </button>
      </>
    );
  }

  return (
    <>
      <p className="mk-auth-modal-step-indicator">
        {step === STEPS.email ? "Step 1 of 3" : null}
        {step === STEPS.code ? "Step 2 of 3" : null}
        {step === STEPS.password ? "Step 3 of 3" : null}
      </p>

      <h2 id="mk-auth-modal-title" className="mk-auth-modal-title">
        {step === STEPS.email ? "Forgot Your Password?" : null}
        {step === STEPS.code ? "Verify Your Code" : null}
        {step === STEPS.password ? "Choose a New Password" : null}
      </h2>

      <p className="mk-auth-modal-subtitle">
        {step === STEPS.email ? "Enter your email address to receive a 6-digit verification code." : null}
        {step === STEPS.code ? "Enter the verification code sent to your email." : null}
        {step === STEPS.password ? "Set a new password for your account." : null}
      </p>

      {infoMessage ? (
        <p className="mk-auth-modal-info" role="status">
          {infoMessage}
        </p>
      ) : null}

      {serverError ? (
        <p className="mk-auth-modal-error" role="alert">
          {serverError}
        </p>
      ) : null}

      {step === STEPS.email ? (
        <form onSubmit={handleSendCode} className="mk-auth-modal-form">
          <div className="mk-auth-modal-field">
            <label htmlFor="mk-auth-reset-email">Email</label>
            <input
              id="mk-auth-reset-email"
              type="email"
              className={`mk-auth-modal-input ${emailError ? "is-invalid" : ""}`}
              placeholder="name@company.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoFocus
              autoComplete="email"
            />
            {emailError ? <p className="mk-auth-modal-field-error">{emailError}</p> : null}
          </div>

          <button type="submit" className="mk-auth-modal-primary" disabled={sendingCode}>
            {sendingCode ? "Sending code..." : "Send reset code"}
          </button>

          <button
            type="button"
            className="mk-auth-modal-secondary"
            onClick={() => onBackToSignIn?.(email)}
            disabled={sendingCode}
          >
            Back to Sign In
          </button>
        </form>
      ) : null}

      {step === STEPS.code ? (
        <form onSubmit={handleVerifyCode} className="mk-auth-modal-form">
          <div className="mk-auth-modal-field">
            <label htmlFor="mk-auth-reset-code">Verification code</label>
            <input
              id="mk-auth-reset-code"
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              className={`mk-auth-modal-input mk-auth-modal-code-input ${
                codeError ? "is-invalid" : ""
              }`}
              placeholder="000000"
              value={code}
              onChange={(event) =>
                setCode(event.target.value.replace(/\D/g, "").slice(0, 6))
              }
              required
              autoFocus
            />
            {codeError ? <p className="mk-auth-modal-field-error">{codeError}</p> : null}
          </div>

          <button type="submit" className="mk-auth-modal-primary" disabled={verifyingCode}>
            {verifyingCode ? "Verifying..." : "Verify code"}
          </button>

          <div className="mk-auth-modal-inline-actions">
            <button
              type="button"
              className="mk-auth-modal-secondary"
              onClick={() => setStep(STEPS.email)}
              disabled={verifyingCode}
            >
              Change Email
            </button>
            <button
              type="button"
              className="mk-auth-modal-secondary"
              onClick={() => onBackToSignIn?.(email)}
              disabled={verifyingCode}
            >
              Back to Sign In
            </button>
          </div>
        </form>
      ) : null}

      {step === STEPS.password ? (
        <form onSubmit={handleResetPassword} className="mk-auth-modal-form">
          <div className="mk-auth-modal-field">
            <label htmlFor="mk-auth-reset-new-password">New password</label>
            <input
              id="mk-auth-reset-new-password"
              type="password"
              className={`mk-auth-modal-input ${newPasswordError ? "is-invalid" : ""}`}
              placeholder="Minimum 8 characters"
              autoComplete="new-password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              required
              autoFocus
            />
            {newPasswordError ? (
              <p className="mk-auth-modal-field-error">{newPasswordError}</p>
            ) : null}
          </div>

          <div className="mk-auth-modal-field">
            <label htmlFor="mk-auth-reset-confirm-password">Confirm password</label>
            <input
              id="mk-auth-reset-confirm-password"
              type="password"
              className={`mk-auth-modal-input ${newPasswordConfirmError ? "is-invalid" : ""}`}
              placeholder="Re-enter new password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
            />
            {newPasswordConfirmError ? (
              <p className="mk-auth-modal-field-error">{newPasswordConfirmError}</p>
            ) : null}
          </div>

          <button type="submit" className="mk-auth-modal-primary" disabled={resettingPassword}>
            {resettingPassword ? "Resetting..." : "Reset password"}
          </button>

          <div className="mk-auth-modal-inline-actions">
            <button
              type="button"
              className="mk-auth-modal-secondary"
              onClick={() => setStep(STEPS.code)}
              disabled={resettingPassword}
            >
              Back to Code
            </button>
            <button
              type="button"
              className="mk-auth-modal-secondary"
              onClick={() => onBackToSignIn?.(email)}
              disabled={resettingPassword}
            >
              Back to Sign In
            </button>
          </div>
        </form>
      ) : null}
    </>
  );
}
