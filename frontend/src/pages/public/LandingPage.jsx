import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import LandingHeader from "../../components/marketing/LandingHeader";
import HeroSection from "../../components/marketing/HeroSection";
import FeaturesSection from "../../components/marketing/FeaturesSection";
import PricingSection from "../../components/marketing/PricingSection";
import TrustSection from "../../components/marketing/TrustSection";
import LandingFooter from "../../components/marketing/LandingFooter";
import { listPublicPlans } from "../../services/public.service";
import { normalizeApiError } from "../../services/error-utils";
import { useAuth } from "../../hooks/useAuth";

export default function LandingPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [plans, setPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [plansError, setPlansError] = useState("");
  const [cycle, setCycle] = useState("monthly");

  useEffect(() => {
    let mounted = true;

    const loadPlans = async () => {
      setPlansLoading(true);
      setPlansError("");

      try {
        const rows = await listPublicPlans();
        if (mounted) {
          setPlans(rows);
        }
      } catch (requestError) {
        if (mounted) {
          setPlansError(normalizeApiError(requestError).message);
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
  }, []);

  if (!authLoading && isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="mk-landing">
      <LandingHeader />
      <HeroSection />
      <FeaturesSection />
      <PricingSection
        plans={plans}
        cycle={cycle}
        onCycleChange={setCycle}
        loading={plansLoading}
        error={plansError}
      />
      <TrustSection />
      <LandingFooter />
    </div>
  );
}
