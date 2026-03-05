import { useEffect, useRef, useState } from "react";

const RECAPTCHA_SCRIPT_ID = "google-recaptcha-script";
const RECAPTCHA_SCRIPT_SRC = "https://www.google.com/recaptcha/api.js?render=explicit";
const RECAPTCHA_READY_TIMEOUT_MS = 10000;
const RECAPTCHA_FAILURE_MESSAGE = "Security verification failed. Please refresh.";

let recaptchaLoader = null;
let hasWarnedMissingKey = false;

function hasRecaptchaRender() {
  return Boolean(window.grecaptcha?.render);
}

function waitForRecaptchaRender(timeoutMs = RECAPTCHA_READY_TIMEOUT_MS) {
  return new Promise((resolve, reject) => {
    const startAt = Date.now();

    const tick = () => {
      if (hasRecaptchaRender()) {
        resolve(window.grecaptcha);
        return;
      }

      if (Date.now() - startAt > timeoutMs) {
        reject(new Error("reCAPTCHA did not become ready."));
        return;
      }

      window.setTimeout(tick, 50);
    };

    tick();
  });
}

function findRecaptchaScript() {
  return (
    document.getElementById(RECAPTCHA_SCRIPT_ID) ??
    document.querySelector('script[src*="google.com/recaptcha/api.js"]')
  );
}

function loadRecaptcha() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("reCAPTCHA is unavailable."));
  }

  if (hasRecaptchaRender()) {
    return Promise.resolve(window.grecaptcha);
  }

  if (recaptchaLoader) {
    return recaptchaLoader;
  }

  recaptchaLoader = new Promise((resolve, reject) => {
    const resolveWhenReady = () => {
      waitForRecaptchaRender()
        .then(resolve)
        .catch((error) => {
          recaptchaLoader = null;
          reject(error);
        });
    };

    const rejectWhenFailed = () => {
      recaptchaLoader = null;
      reject(new Error("Unable to load reCAPTCHA script."));
    };

    const existing = findRecaptchaScript();

    if (existing) {
      existing.addEventListener("load", resolveWhenReady, { once: true });
      existing.addEventListener("error", rejectWhenFailed, { once: true });
      window.setTimeout(resolveWhenReady, 0);
      return;
    }

    const script = document.createElement("script");
    script.id = RECAPTCHA_SCRIPT_ID;
    script.src = RECAPTCHA_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.addEventListener("load", resolveWhenReady, { once: true });
    script.addEventListener("error", rejectWhenFailed, { once: true });
    document.head.appendChild(script);
  });

  return recaptchaLoader;
}

export default function RecaptchaField({
  siteKey,
  token,
  onTokenChange,
  className = "",
  theme = "light",
  error = "",
}) {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);
  const [status, setStatus] = useState("loading_script");

  useEffect(() => {
    let cancelled = false;

    if (!siteKey) {
      if (!hasWarnedMissingKey) {
        console.warn(
          "[reCAPTCHA] Missing VITE_RECAPTCHA_SITE_KEY. Security verification cannot be rendered."
        );
        hasWarnedMissingKey = true;
      }

      onTokenChange("");
      return () => {};
    }

    loadRecaptcha()
      .then((grecaptcha) => {
        if (cancelled || !containerRef.current || !grecaptcha?.render) {
          return;
        }

        if (widgetIdRef.current === null) {
          widgetIdRef.current = grecaptcha.render(containerRef.current, {
            sitekey: siteKey,
            theme,
            callback: (nextToken) => {
              const normalizedToken = nextToken ?? "";
              onTokenChange(normalizedToken);
              setStatus(normalizedToken ? "captcha_verified" : "captcha_ready");
            },
            "expired-callback": () => {
              onTokenChange("");
              setStatus("captcha_ready");
            },
            "error-callback": () => {
              onTokenChange("");
              setStatus("captcha_error");
            },
          });
        } else if (window.grecaptcha?.reset) {
          window.grecaptcha.reset(widgetIdRef.current);
        }

        setStatus("captcha_ready");
      })
      .catch(() => {
        if (!cancelled) {
          setStatus("captcha_error");
          onTokenChange("");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [siteKey, theme, onTokenChange]);

  useEffect(() => {
    if (!token && widgetIdRef.current !== null && window.grecaptcha?.reset) {
      window.grecaptcha.reset(widgetIdRef.current);
    }
  }, [token]);

  const effectiveStatus =
    token && status === "captcha_ready" ? "captcha_verified" : status;
  const isLoading = Boolean(siteKey) && effectiveStatus === "loading_script";
  const hasCaptchaError = !siteKey || effectiveStatus === "captcha_error";

  return (
    <div className={`recaptcha-field ${className}`.trim()}>
      <div ref={containerRef} />

      {isLoading ? (
        <p className="recaptcha-field-meta">Loading security check...</p>
      ) : null}

      {hasCaptchaError ? (
        <p className="recaptcha-field-meta recaptcha-field-error">
          {RECAPTCHA_FAILURE_MESSAGE}
        </p>
      ) : null}

      {error ? <p className="recaptcha-field-meta recaptcha-field-error">{error}</p> : null}
    </div>
  );
}
