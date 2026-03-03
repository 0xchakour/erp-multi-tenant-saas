import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import PageSection from "../../components/shared/PageSection";
import Spinner from "../../components/ui/Spinner";
import Alert from "../../components/ui/Alert";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import TextInput from "../../components/ui/TextInput";
import SelectInput from "../../components/ui/SelectInput";
import {
  createInvoicePayment,
  deleteInvoice,
  deleteInvoicePayment,
  downloadInvoicePdf,
  getInvoiceById,
  updateInvoiceStatus,
} from "../../services/invoice.service";
import { hasContractEndpoint } from "../../services/backend-contract";
import { firstFieldError, normalizeApiError } from "../../services/error-utils";
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

const PAYMENT_METHOD_OPTIONS = [
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "card", label: "Card" },
  { value: "cash", label: "Cash" },
  { value: "other", label: "Other" },
];

export default function InvoiceDetails() {
  const { invoiceId } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deletingPaymentId, setDeletingPaymentId] = useState(null);
  const [recordingPayment, setRecordingPayment] = useState(false);
  const [paymentErrors, setPaymentErrors] = useState({});

  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    paid_at: new Date().toISOString().slice(0, 10),
    method: "bank_transfer",
    reference: "",
    notes: "",
  });

  const detailsSupported = hasContractEndpoint("invoices", "details");
  const pdfSupported = hasContractEndpoint("invoices", "pdf");
  const statusSupported = hasContractEndpoint("invoices", "status");
  const destroySupported = hasContractEndpoint("invoices", "destroy");
  const paymentCreateSupported = hasContractEndpoint("invoices", "paymentsCreate");
  const paymentDeleteSupported = hasContractEndpoint("invoices", "paymentsDelete");

  const loadInvoice = async () => {
    setLoading(true);
    setError("");

    try {
      const row = await getInvoiceById(invoiceId);
      setInvoice(row);
      setPaymentForm((prev) => ({
        ...prev,
        amount: String(row.financials?.balance_due ?? ""),
      }));
    } catch (requestError) {
      setError(normalizeApiError(requestError).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoice();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoiceId]);

  const canShowDetails = useMemo(
    () => detailsSupported && !loading && !error && Boolean(invoice),
    [detailsSupported, loading, error, invoice]
  );

  const handlePdfDownload = async () => {
    setDownloadingPdf(true);
    setError("");
    setSuccess("");

    try {
      const blob = await downloadInvoicePdf(invoiceId);
      downloadBlob(blob, `invoice-${invoice?.invoice_number ?? invoiceId}.pdf`);
    } catch (downloadError) {
      setError(normalizeApiError(downloadError).message);
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleSend = async () => {
    setUpdatingStatus(true);
    setError("");
    setSuccess("");

    try {
      const updated = await updateInvoiceStatus(invoiceId, { status: "sent" });
      setInvoice(updated);
      setSuccess("Invoice sent.");
    } catch (requestError) {
      setError(normalizeApiError(requestError).message);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleCancelInvoice = async () => {
    const reason = window.prompt("Cancellation reason", "Cancelled by admin");

    if (reason === null) {
      return;
    }

    setUpdatingStatus(true);
    setError("");
    setSuccess("");

    try {
      const updated = await updateInvoiceStatus(invoiceId, {
        status: "cancelled",
        reason,
      });
      setInvoice(updated);
      setSuccess("Invoice cancelled.");
    } catch (requestError) {
      setError(normalizeApiError(requestError).message);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleRecordPayment = async (event) => {
    event.preventDefault();
    setRecordingPayment(true);
    setError("");
    setSuccess("");
    setPaymentErrors({});

    try {
      const response = await createInvoicePayment(invoiceId, {
        ...paymentForm,
        amount: Number(paymentForm.amount),
      });

      setInvoice(response.invoice);
      setSuccess("Payment recorded.");
      setPaymentForm((prev) => ({
        ...prev,
        amount: String(response.invoice?.financials?.balance_due ?? ""),
        reference: "",
        notes: "",
      }));
    } catch (requestError) {
      const normalized = normalizeApiError(requestError);
      setError(normalized.message);
      setPaymentErrors(normalized.validationErrors);
    } finally {
      setRecordingPayment(false);
    }
  };

  const handleDeletePayment = async (paymentId) => {
    const confirmed = window.confirm("Delete this payment?");

    if (!confirmed) {
      return;
    }

    setDeletingPaymentId(paymentId);
    setError("");
    setSuccess("");

    try {
      const response = await deleteInvoicePayment(invoiceId, paymentId);
      setInvoice(response.invoice ?? invoice);
      setSuccess("Payment deleted.");
    } catch (requestError) {
      setError(normalizeApiError(requestError).message);
    } finally {
      setDeletingPaymentId(null);
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm("Delete this invoice?");

    if (!confirmed) {
      return;
    }

    setDeleting(true);
    setError("");
    setSuccess("");

    try {
      await deleteInvoice(invoiceId);
      navigate("/invoices", { replace: true });
    } catch (requestError) {
      setError(normalizeApiError(requestError).message);
      setDeleting(false);
    }
  };

  return (
    <PageSection
      title={`Invoice ${invoiceId}`}
      description="Details, payment tracking, and lifecycle transitions."
      actions={
        <Link to="/invoices">
          <Button variant="ghost">Back to Invoices</Button>
        </Link>
      }
    >
      {!detailsSupported ? (
        <Alert variant="warning">
          Invoice details endpoint is not available in backend contract.
        </Alert>
      ) : null}

      {loading ? <Spinner label="Loading invoice details..." /> : null}
      {!loading && error ? <Alert variant="danger">{error}</Alert> : null}
      {!loading && success ? <Alert variant="success">{success}</Alert> : null}

      {canShowDetails ? (
        <div className="stack-lg">
          <div className="invoice-header">
            <div>
              <p>
                <strong>Invoice Number:</strong> {invoice.invoice_number}
              </p>
              <p>
                <strong>Client:</strong> {invoice.client?.name ?? "-"}
              </p>
              <p>
                <strong>Due Date:</strong> {invoice.due_date}
              </p>
            </div>
            <Badge status={invoice.status} />
          </div>

          <div className="totals-grid">
            <article>
              <p>Subtotal</p>
              <strong>{formatCurrency(invoice.financials?.subtotal)}</strong>
            </article>
            <article>
              <p>Tax</p>
              <strong>{formatCurrency(invoice.financials?.tax_amount)}</strong>
            </article>
            <article>
              <p>Total</p>
              <strong>{formatCurrency(invoice.financials?.total)}</strong>
            </article>
            <article>
              <p>Paid</p>
              <strong>{formatCurrency(invoice.financials?.paid_amount)}</strong>
            </article>
            <article>
              <p>Balance Due</p>
              <strong>{formatCurrency(invoice.financials?.balance_due)}</strong>
            </article>
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th>Product ID</th>
                <th>Quantity</th>
                <th>Snapshot Price</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, index) => (
                <tr key={`invoice-item-${index}`}>
                  <td>{item.product_id}</td>
                  <td>{item.quantity}</td>
                  <td>{formatCurrency(item.price)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <PageSection
            title="Payments"
            description="Revenue is recognized from recorded payments."
          >
            {invoice.payments?.length ? (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Method</th>
                    <th>Reference</th>
                    <th>Amount</th>
                    {isAdmin && paymentDeleteSupported ? <th>Actions</th> : null}
                  </tr>
                </thead>
                <tbody>
                  {invoice.payments.map((payment) => (
                    <tr key={payment.id}>
                      <td>{payment.paid_at}</td>
                      <td>{payment.method}</td>
                      <td>{payment.reference || "-"}</td>
                      <td>{formatCurrency(payment.amount)}</td>
                      {isAdmin && paymentDeleteSupported ? (
                        <td className="row-actions">
                          <Button
                            variant="danger"
                            onClick={() => handleDeletePayment(payment.id)}
                            loading={deletingPaymentId === payment.id}
                          >
                            Delete Payment
                          </Button>
                        </td>
                      ) : null}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <Alert variant="info">No payments recorded yet.</Alert>
            )}

            {isAdmin &&
            paymentCreateSupported &&
            invoice.status !== "cancelled" &&
            Number(invoice.financials?.balance_due ?? 0) > 0 ? (
              <form className="form-grid" onSubmit={handleRecordPayment}>
                <TextInput
                  id="payment-amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  label="Amount"
                  value={paymentForm.amount}
                  onChange={(event) =>
                    setPaymentForm((prev) => ({ ...prev, amount: event.target.value }))
                  }
                  error={firstFieldError(paymentErrors, "amount")}
                />
                <TextInput
                  id="payment-date"
                  type="date"
                  label="Paid At"
                  value={paymentForm.paid_at}
                  onChange={(event) =>
                    setPaymentForm((prev) => ({ ...prev, paid_at: event.target.value }))
                  }
                  error={firstFieldError(paymentErrors, "paid_at")}
                />
                <SelectInput
                  id="payment-method"
                  label="Method"
                  value={paymentForm.method}
                  onChange={(event) =>
                    setPaymentForm((prev) => ({ ...prev, method: event.target.value }))
                  }
                  options={PAYMENT_METHOD_OPTIONS}
                  error={firstFieldError(paymentErrors, "method")}
                />
                <TextInput
                  id="payment-reference"
                  label="Reference"
                  placeholder="TXN-12345"
                  value={paymentForm.reference}
                  onChange={(event) =>
                    setPaymentForm((prev) => ({ ...prev, reference: event.target.value }))
                  }
                  error={firstFieldError(paymentErrors, "reference")}
                />
                <TextInput
                  id="payment-notes"
                  label="Notes"
                  placeholder="Optional note"
                  value={paymentForm.notes}
                  onChange={(event) =>
                    setPaymentForm((prev) => ({ ...prev, notes: event.target.value }))
                  }
                  error={firstFieldError(paymentErrors, "notes")}
                />

                <div className="form-actions">
                  <Button type="submit" loading={recordingPayment}>
                    Record Payment
                  </Button>
                </div>
              </form>
            ) : null}
          </PageSection>

          <div className="form-actions">
            <Button
              onClick={handlePdfDownload}
              disabled={!pdfSupported}
              loading={downloadingPdf}
            >
              Download PDF
            </Button>

            {isAdmin && statusSupported && invoice.status === "draft" ? (
              <Button onClick={handleSend} loading={updatingStatus}>
                Send Invoice
              </Button>
            ) : null}

            {isAdmin &&
            statusSupported &&
            ["draft", "sent", "overdue"].includes(invoice.status) &&
            Number(invoice.financials?.paid_amount ?? 0) <= 0 ? (
              <Button variant="danger" onClick={handleCancelInvoice} loading={updatingStatus}>
                Cancel Invoice
              </Button>
            ) : null}

            {isAdmin && destroySupported ? (
              <Button
                variant="danger"
                onClick={handleDelete}
                disabled={
                  invoice.status === "paid" || Number(invoice.financials?.paid_amount ?? 0) > 0
                }
                loading={deleting}
              >
                Delete Invoice
              </Button>
            ) : null}

            {!pdfSupported ? (
              <Alert variant="warning">PDF endpoint is not available.</Alert>
            ) : null}
          </div>
        </div>
      ) : null}
    </PageSection>
  );
}
