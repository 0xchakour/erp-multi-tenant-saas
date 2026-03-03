import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import PageSection from "../../components/shared/PageSection";
import Spinner from "../../components/ui/Spinner";
import Alert from "../../components/ui/Alert";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import TextInput from "../../components/ui/TextInput";
import EmptyState from "../../components/ui/EmptyState";
import Pagination from "../../components/ui/Pagination";
import {
  deleteInvoice,
  downloadInvoicePdf,
  listInvoices,
  updateInvoiceStatus,
} from "../../services/invoice.service";
import { hasContractEndpoint } from "../../services/backend-contract";
import { normalizeApiError } from "../../services/error-utils";
import { useAuth } from "../../hooks/useAuth";

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(Number(value ?? 0));
}

function downloadBlob(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
}

const STATUS_FILTERS = [
  { value: "all", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Sent" },
  { value: "partially_paid", label: "Partially Paid" },
  { value: "paid", label: "Paid" },
  { value: "overdue", label: "Overdue" },
  { value: "cancelled", label: "Cancelled" },
];

export default function Invoices() {
  const { isAdmin } = useAuth();

  const [invoices, setInvoices] = useState([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoadingKey, setActionLoadingKey] = useState("");

  const listSupported = hasContractEndpoint("invoices", "list");
  const detailsSupported = hasContractEndpoint("invoices", "details");
  const pdfSupported = hasContractEndpoint("invoices", "pdf");
  const statusSupported = hasContractEndpoint("invoices", "status");
  const destroySupported = hasContractEndpoint("invoices", "destroy");

  const loadInvoices = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const rows = await listInvoices();
      setInvoices(rows);
    } catch (requestError) {
      setError(normalizeApiError(requestError).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  useEffect(() => {
    setPage(1);
  }, [query, statusFilter, pageSize]);

  const handlePdf = async (invoice) => {
    const key = `pdf-${invoice.id}`;
    setActionLoadingKey(key);
    setError("");

    try {
      const blob = await downloadInvoicePdf(invoice.id);
      downloadBlob(blob, `invoice-${invoice.invoice_number}.pdf`);
    } catch (requestError) {
      setError(normalizeApiError(requestError).message);
    } finally {
      setActionLoadingKey("");
    }
  };

  const handleSend = async (invoiceId) => {
    const key = `send-${invoiceId}`;
    setActionLoadingKey(key);
    setError("");

    try {
      await updateInvoiceStatus(invoiceId, { status: "sent" });
      await loadInvoices();
    } catch (requestError) {
      setError(normalizeApiError(requestError).message);
    } finally {
      setActionLoadingKey("");
    }
  };

  const handleCancel = async (invoiceId) => {
    const reason = window.prompt("Cancellation reason", "Cancelled by admin");

    if (reason === null) {
      return;
    }

    const key = `cancel-${invoiceId}`;
    setActionLoadingKey(key);
    setError("");

    try {
      await updateInvoiceStatus(invoiceId, { status: "cancelled", reason });
      await loadInvoices();
    } catch (requestError) {
      setError(normalizeApiError(requestError).message);
    } finally {
      setActionLoadingKey("");
    }
  };

  const handleDelete = async (invoice) => {
    const confirmed = window.confirm("Delete this invoice?");

    if (!confirmed) {
      return;
    }

    const key = `delete-${invoice.id}`;
    setActionLoadingKey(key);
    setError("");

    try {
      await deleteInvoice(invoice.id);
      await loadInvoices();
    } catch (requestError) {
      setError(normalizeApiError(requestError).message);
    } finally {
      setActionLoadingKey("");
    }
  };

  const statusCounts = useMemo(() => {
    return invoices.reduce((acc, invoice) => {
      const status = String(invoice.status ?? "").toLowerCase();
      if (!status) {
        return acc;
      }

      acc[status] = (acc[status] ?? 0) + 1;
      return acc;
    }, {});
  }, [invoices]);

  const filteredInvoices = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return invoices.filter((invoice) => {
      const matchesStatus =
        statusFilter === "all" || String(invoice.status ?? "").toLowerCase() === statusFilter;

      if (!matchesStatus) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      return [
        invoice.invoice_number,
        invoice.client?.name,
        invoice.status,
        invoice.due_date,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedQuery));
    });
  }, [invoices, query, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredInvoices.length / pageSize));

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const paginatedInvoices = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredInvoices.slice(start, start + pageSize);
  }, [filteredInvoices, page, pageSize]);

  return (
    <PageSection
      title="Invoices"
      description="Invoice lifecycle is tracked with payments and strict transition rules."
      actions={
        isAdmin ? (
          <Link to="/invoices/new">
            <Button>Create Invoice</Button>
          </Link>
        ) : null
      }
    >
      {!isAdmin ? (
        <Alert variant="info">
          Your role is read-only for invoice creation actions.
        </Alert>
      ) : null}

      {!listSupported ? (
        <Alert variant="warning">
          Invoice list endpoint is not available in backend contract.
        </Alert>
      ) : null}

      {loading ? <Spinner label="Loading invoices..." /> : null}
      {!loading && error ? <Alert variant="danger">{error}</Alert> : null}

      {!loading && !error && listSupported ? (
        <>
          <div className="table-toolbar">
            <div className="toolbar-left">
              <TextInput
                id="invoices-search"
                label="Search"
                className="toolbar-search"
                placeholder="Invoice number, client, status..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
            <div className="toolbar-right">
              {STATUS_FILTERS.map((filter) => {
                const count = filter.value === "all" ? invoices.length : statusCounts[filter.value] ?? 0;
                const isActive = statusFilter === filter.value;

                return (
                  <button
                    key={filter.value}
                    type="button"
                    className={`chip-filter ${isActive ? "chip-filter-active" : ""}`.trim()}
                    onClick={() => setStatusFilter(filter.value)}
                  >
                    {filter.label} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          <p className="toolbar-summary">
            {filteredInvoices.length} result{filteredInvoices.length === 1 ? "" : "s"}
          </p>

          {filteredInvoices.length === 0 ? (
            <EmptyState
              title="No invoices match these filters"
              description="Try another search term or status."
              action={
                isAdmin ? (
                  <Link to="/invoices/new">
                    <Button>Create Invoice</Button>
                  </Link>
                ) : null
              }
            />
          ) : (
            <>
              <div className="table-shell">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Invoice</th>
                      <th>Client</th>
                      <th>Status</th>
                      <th>Total</th>
                      <th>Paid</th>
                      <th>Balance</th>
                      <th>Due Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedInvoices.map((invoice) => {
                      const paidAmount = invoice.financials?.paid_amount ?? 0;
                      const balanceDue = invoice.financials?.balance_due ?? 0;

                      return (
                        <tr key={invoice.id}>
                          <td>{invoice.invoice_number}</td>
                          <td>{invoice.client?.name ?? "-"}</td>
                          <td>
                            <Badge status={invoice.status} />
                          </td>
                          <td>{formatCurrency(invoice.financials?.total)}</td>
                          <td>{formatCurrency(paidAmount)}</td>
                          <td>{formatCurrency(balanceDue)}</td>
                          <td>{invoice.due_date}</td>
                          <td className="row-actions">
                            {detailsSupported ? (
                              <Link to={`/invoices/${invoice.id}`}>
                                <Button variant="ghost">View</Button>
                              </Link>
                            ) : (
                              <Button variant="ghost" disabled>
                                View
                              </Button>
                            )}

                            {pdfSupported ? (
                              <Button
                                variant="ghost"
                                onClick={() => handlePdf(invoice)}
                                loading={actionLoadingKey === `pdf-${invoice.id}`}
                              >
                                PDF
                              </Button>
                            ) : (
                              <Button variant="ghost" disabled>
                                PDF
                              </Button>
                            )}

                            {isAdmin && statusSupported && invoice.status === "draft" ? (
                              <Button
                                onClick={() => handleSend(invoice.id)}
                                loading={actionLoadingKey === `send-${invoice.id}`}
                              >
                                Send
                              </Button>
                            ) : null}

                            {isAdmin &&
                            statusSupported &&
                            ["draft", "sent", "overdue"].includes(invoice.status) &&
                            paidAmount <= 0 ? (
                              <Button
                                variant="danger"
                                onClick={() => handleCancel(invoice.id)}
                                loading={actionLoadingKey === `cancel-${invoice.id}`}
                              >
                                Cancel
                              </Button>
                            ) : null}

                            {isAdmin && destroySupported ? (
                              <Button
                                variant="danger"
                                onClick={() => handleDelete(invoice)}
                                disabled={invoice.status === "paid" || paidAmount > 0}
                                loading={actionLoadingKey === `delete-${invoice.id}`}
                              >
                                Delete
                              </Button>
                            ) : null}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <Pagination
                page={page}
                totalPages={totalPages}
                totalItems={filteredInvoices.length}
                pageSize={pageSize}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
              />
            </>
          )}
        </>
      ) : null}
    </PageSection>
  );
}
