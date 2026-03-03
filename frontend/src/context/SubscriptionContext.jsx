import { useEffect, useMemo, useState } from "react";
import { apiEvents } from "../services/api-events";
import { SubscriptionContext } from "./subscription-context";

export function SubscriptionProvider({ children }) {
  const [subscriptionError, setSubscriptionError] = useState(null);

  useEffect(() => {
    const unsubscribeBlocked = apiEvents.onSubscriptionBlocked((payload) => {
      setSubscriptionError({
        message: payload.message,
        occurredAt: new Date().toISOString(),
      });
    });

    const unsubscribeUnauthorized = apiEvents.onUnauthorized(() => {
      setSubscriptionError(null);
    });

    return () => {
      unsubscribeBlocked();
      unsubscribeUnauthorized();
    };
  }, []);

  const value = useMemo(
    () => ({
      subscriptionError,
      clearSubscriptionError: () => setSubscriptionError(null),
    }),
    [subscriptionError]
  );

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}
