import { useEffect, useMemo, useState } from "react";
import PageSection from "../../components/shared/PageSection";
import Alert from "../../components/ui/Alert";
import Button from "../../components/ui/Button";
import Spinner from "../../components/ui/Spinner";
import TextInput from "../../components/ui/TextInput";
import {
  getAgingReport,
  getRevenueReport,
  getTopClientsReport,
} from "../../services/report.service";
import { normalizeApiError } from "../../services/error-utils";
import { hasContractEndpoint } from "../../services/backend-contract";

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(Number(value ?? 0));
}

export default function Reports() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [asOfDate, setAsOfDate] = useState("");
  const [limit, setLimit] = useState("10");

  const [revenue, setRevenue] = useState(null);
  const [aging, setAging] = useState(null);
  const [topClients, setTopClients] = useState(null);

  const reportsSupported =
    hasContractEndpoint("reports", "revenue") &&
    hasContractEndpoint("reports", "aging") &&
    hasContractEndpoint("reports", "topClients");

  const hasData = useMemo(
    () => Boolean(revenue && aging && topClients),
    [revenue, aging, topClients]
  );

  const loadReports = async () => {
    setLoading(true);
    setError("");

    try {
      const queryWindow = {
        ...(fromDate ? { from: fromDate } : {}),
        ...(toDate ? { to: toDate } : {}),
      };

      const [revenueData, agingData, topClientsData] = await Promise.all([
        getRevenueReport(queryWindow),
        getAgingReport(asOfDate ? { as_of: asOfDate } : {}),
        getTopClientsReport({
          ...queryWindow,
          ...(limit ? { limit: Number(limit) } : {}),
        }),
      ]);

      setRevenue(revenueData);
      setAging(agingData);
      setTopClients(topClientsData);
    } catch (requestError) {
      setError(normalizeApiError(requestError).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="stack-lg fade-in">
      <PageSection
        title="Reports"
        description="Revenue, invoice aging, and top-client collections."
      >
        {!reportsSupported ? (
          <Alert variant="warning">
            Reports endpoints are not available in the backend contract.
          </Alert>
        ) : null}

        {reportsSupported ? (
          <form
            className="form-grid"
            onSubmit={(event) => {
              event.preventDefault();
              loadReports();
            }}
          >
            <TextInput
              id="reports-from"
              type="date"
              label="From"
              value={fromDate}
              onChange={(event) => setFromDate(event.target.value)}
            />
            <TextInput
              id="reports-to"
              type="date"
              label="To"
              value={toDate}
              onChange={(event) => setToDate(event.target.value)}
            />
            <TextInput
              id="reports-as-of"
              type="date"
              label="Aging As Of"
              value={asOfDate}
              onChange={(event) => setAsOfDate(event.target.value)}
            />
            <TextInput
              id="reports-limit"
              type="number"
              min="1"
              max="100"
              label="Top Clients Limit"
              value={limit}
              onChange={(event) => setLimit(event.target.value)}
            />
            <div className="form-actions">
              <Button type="submit" loading={loading}>
                Refresh Reports
              </Button>
            </div>
          </form>
        ) : null}
      </PageSection>

      {loading ? <Spinner label="Loading reports..." /> : null}
      {!loading && error ? <Alert variant="danger">{error}</Alert> : null}

      {!loading && !error && hasData ? (
        <>
          <PageSection
            title="Revenue Summary"
            description="Revenue is computed from recorded payments."
          >
            <div className="metric-grid">
              <article className="metric-card">
                <p className="metric-title">Total Revenue</p>
                <p className="metric-value">
                  {formatCurrency(revenue.summary?.total_revenue)}
                </p>
              </article>
              <article className="metric-card">
                <p className="metric-title">Payments Count</p>
                <p className="metric-value">{revenue.summary?.payments_count ?? 0}</p>
              </article>
              <article className="metric-card">
                <p className="metric-title">Average Payment</p>
                <p className="metric-value">
                  {formatCurrency(revenue.summary?.average_payment)}
                </p>
              </article>
              <article className="metric-card">
                <p className="metric-title">Outstanding</p>
                <p className="metric-value">
                  {formatCurrency(revenue.summary?.outstanding_amount)}
                </p>
              </article>
            </div>
          </PageSection>

          <PageSection
            title="Aging Buckets"
            description="Open balances grouped by overdue age."
          >
            <div className="metric-grid">
              <article className="metric-card">
                <p className="metric-title">Current</p>
                <p className="metric-value">
                  {formatCurrency(aging.summary?.buckets?.current)}
                </p>
              </article>
              <article className="metric-card">
                <p className="metric-title">1-30 Days</p>
                <p className="metric-value">
                  {formatCurrency(aging.summary?.buckets?.days_1_30)}
                </p>
              </article>
              <article className="metric-card">
                <p className="metric-title">31-60 Days</p>
                <p className="metric-value">
                  {formatCurrency(aging.summary?.buckets?.days_31_60)}
                </p>
              </article>
              <article className="metric-card">
                <p className="metric-title">61-90 Days</p>
                <p className="metric-value">
                  {formatCurrency(aging.summary?.buckets?.days_61_90)}
                </p>
              </article>
            </div>
            <div className="metric-grid metric-grid-single">
              <article className="metric-card">
                <p className="metric-title">91+ Days</p>
                <p className="metric-value">
                  {formatCurrency(aging.summary?.buckets?.days_91_plus)}
                </p>
              </article>
            </div>
          </PageSection>

          <PageSection
            title="Top Clients by Collections"
            description="Ranked by payment totals in selected period."
          >
            {topClients.rows?.length ? (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Client</th>
                    <th>Total Paid</th>
                    <th>Payments</th>
                  </tr>
                </thead>
                <tbody>
                  {topClients.rows.map((row) => (
                    <tr key={row.client_id}>
                      <td>{row.client_name}</td>
                      <td>{formatCurrency(row.total_paid)}</td>
                      <td>{row.payments_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <Alert variant="info">No client payment data for the selected period.</Alert>
            )}
          </PageSection>
        </>
      ) : null}
    </div>
  );
}
