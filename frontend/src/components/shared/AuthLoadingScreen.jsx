import { useEffect, useMemo, useState } from "react";
import BrandLogo from "./BrandLogo";

const DEFAULT_MESSAGES = [
  "Initializing Tenant Workspace...",
  "Syncing Modules...",
  "Securing Session...",
  "Preparing Operational Intelligence...",
];

export default function AuthLoadingScreen({ messages = DEFAULT_MESSAGES }) {
  const safeMessages = useMemo(
    () => (Array.isArray(messages) && messages.length > 0 ? messages : DEFAULT_MESSAGES),
    [messages]
  );
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setMessageIndex((current) => (current + 1) % safeMessages.length);
    }, 1850);

    return () => clearInterval(intervalId);
  }, [safeMessages.length]);

  return (
    <section className="app-loading-screen" aria-label="Application loading screen">
      <div className="app-loading-background" aria-hidden="true">
        <span className="app-loading-orb app-loading-orb-a" />
        <span className="app-loading-orb app-loading-orb-b" />
        <span className="app-loading-orb app-loading-orb-c" />
      </div>

      <div className="app-loading-card" role="status" aria-live="polite">
        <div className="app-loading-logo-wrap">
          <BrandLogo
            size={66}
            withWordmark={false}
            className="app-loading-logo"
            title="Tenant ERP"
            subtitle="Enterprise SaaS"
          />
        </div>

        <div className="app-loading-copy">
          <p className="app-loading-kicker">Enterprise Platform</p>
          <h1>Booting your secure workspace</h1>
          <p key={messageIndex} className="app-loading-message fade-in">
            {safeMessages[messageIndex]}
          </p>
        </div>

        <div className="app-loading-progress" aria-hidden="true">
          <span className="app-loading-progress-track">
            <span className="app-loading-progress-fill" />
          </span>
          <span className="app-loading-pulse" />
        </div>
      </div>
    </section>
  );
}
