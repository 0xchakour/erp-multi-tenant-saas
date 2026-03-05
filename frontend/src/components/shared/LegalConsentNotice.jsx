export default function LegalConsentNotice({
  className = "",
  linkClassName = "",
}) {
  return (
    <p className={`legal-consent-note ${className}`.trim()}>
      By signing in, you agree to Nexora&apos;s{" "}
      <a
        className={linkClassName}
        href="/terms-of-service"
        target="_blank"
        rel="noopener noreferrer"
      >
        Terms of Service
      </a>{" "}
      and{" "}
      <a
        className={linkClassName}
        href="/privacy-policy"
        target="_blank"
        rel="noopener noreferrer"
      >
        Privacy Policy
      </a>
      .
    </p>
  );
}
