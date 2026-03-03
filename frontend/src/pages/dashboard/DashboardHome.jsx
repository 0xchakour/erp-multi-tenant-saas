import { useEffect, useState } from "react";
import PageSection from "../../components/shared/PageSection";
import Card from "../../components/ui/Card";
import Spinner from "../../components/ui/Spinner";
import Alert from "../../components/ui/Alert";
import { getDashboardStats } from "../../services/dashboard.service";
import { normalizeApiError } from "../../services/error-utils";

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(Number(value ?? 0));
}

export default function DashboardHome() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    const loadStats = async () => {
      setLoading(true);
      setError("");

      try {
        const stats = await getDashboardStats();
        if (mounted) {
          setDashboard(stats);
        }
      } catch (requestError) {
        if (mounted) {
          setError(normalizeApiError(requestError).message);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadStats();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <PageSection title="Dashboard" description="Loading dashboard metrics.">
        <Spinner label="Fetching analytics..." />
      </PageSection>
    );
  }

  if (error) {
    return (
      <PageSection title="Dashboard" description="Metrics request failed.">
        <Alert variant="danger">{error}</Alert>
      </PageSection>
    );
  }

  return (
    <div className="stack-lg fade-in">
      <PageSection
        title="Dashboard Overview"
        description="Server-calculated revenue and invoice status metrics."
      >
        <div className="metric-grid">
          <Card
            title="Total Revenue"
            value={formatCurrency(dashboard.metrics.total_revenue)}
          />
          <Card
            title="Monthly Revenue"
            value={formatCurrency(dashboard.metrics.monthly_revenue)}
          />
          <Card title="Paid Invoices" value={dashboard.metrics.paid_invoices} />
          <Card
            title="Overdue Invoices"
            value={dashboard.metrics.overdue_invoices}
          />
          <Card title="Sent Invoices" value={dashboard.metrics.sent_invoices} />
          <Card
            title="Partially Paid"
            value={dashboard.metrics.partially_paid_invoices}
          />
          <Card
            title="Cancelled Invoices"
            value={dashboard.metrics.cancelled_invoices}
          />
          <Card
            title="Outstanding Amount"
            value={formatCurrency(dashboard.metrics.outstanding_amount)}
          />
        </div>
      </PageSection>

      <PageSection
        title="Revenue by Month"
        description="Last 12 months, paid invoices only."
      >
        {dashboard.revenue_chart.length === 0 ? (
          <Alert variant="info">No paid-invoice revenue data yet.</Alert>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Year</th>
                <th>Month</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {dashboard.revenue_chart.map((row) => (
                <tr key={`${row.year}-${row.month}`}>
                  <td>{row.year}</td>
                  <td>{row.month}</td>
                  <td>{formatCurrency(row.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </PageSection>
    </div>
  );
}
