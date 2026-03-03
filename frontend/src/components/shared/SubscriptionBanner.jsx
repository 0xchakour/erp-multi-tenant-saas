import { useSubscription } from "../../hooks/useSubscription";
import { Link } from "react-router-dom";
import Alert from "../ui/Alert";

export default function SubscriptionBanner() {
  const { subscriptionError, clearSubscriptionError } = useSubscription();

  if (!subscriptionError) {
    return null;
  }

  return (
    <div className="subscription-banner-wrap">
      <Alert variant="warning" onClose={clearSubscriptionError}>
        <>
          {subscriptionError.message}{" "}
          <Link className="inline-link" to="/billing">
            Manage Billing
          </Link>
        </>
      </Alert>
    </div>
  );
}
