import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import PageSection from "../../components/shared/PageSection";
import Alert from "../../components/ui/Alert";
import Button from "../../components/ui/Button";
import SelectInput from "../../components/ui/SelectInput";
import Spinner from "../../components/ui/Spinner";
import TextInput from "../../components/ui/TextInput";
import Badge from "../../components/ui/Badge";
import { listClients } from "../../services/client.service";
import { createInvoice } from "../../services/invoice.service";
import { listProducts } from "../../services/product.service";
import { normalizeApiError } from "../../services/error-utils";
import { hasContractEndpoint } from "../../services/backend-contract";
import { useAuth } from "../../hooks/useAuth";

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(Number(value ?? 0));
}

function makeEmptyRow() {
  return { product_id: "", quantity: 1 };
}

export default function InvoiceCreate() {
  const { isAdmin } = useAuth();

  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(true);

  const [loadError, setLoadError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [rowErrors, setRowErrors] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const [clientId, setClientId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [items, setItems] = useState([makeEmptyRow()]);
  const [createdInvoice, setCreatedInvoice] = useState(null);

  const productsSupported = hasContractEndpoint("products", "list");

  useEffect(() => {
    let mounted = true;

    const loadPageDependencies = async () => {
      setLoadError("");
      setClientsLoading(true);
      setProductsLoading(true);

      try {
        const clientRows = await listClients();
        if (mounted) {
          setClients(clientRows);
        }
      } catch (error) {
        if (mounted) {
          setLoadError(normalizeApiError(error).message);
        }
      } finally {
        if (mounted) {
          setClientsLoading(false);
        }
      }

      try {
        const productRows = await listProducts();
        if (mounted) {
          setProducts(productRows);
        }
      } catch (error) {
        if (mounted && productsSupported) {
          setLoadError(normalizeApiError(error).message);
        }
      } finally {
        if (mounted) {
          setProductsLoading(false);
        }
      }
    };

    loadPageDependencies();
    return () => {
      mounted = false;
    };
  }, [productsSupported]);

  const clientOptions = useMemo(
    () =>
      clients.map((client) => ({
        value: String(client.id),
        label: `${client.name}${client.email ? ` (${client.email})` : ""}`,
      })),
    [clients]
  );

  const productOptions = useMemo(
    () =>
      products.map((product) => ({
        value: String(product.id),
        label: `${product.name} (${product.sku})`,
      })),
    [products]
  );

  const addRow = () => {
    setItems((prev) => [...prev, makeEmptyRow()]);
  };

  const removeRow = (index) => {
    setItems((prev) => prev.filter((_, rowIndex) => rowIndex !== index));
    setRowErrors((prev) => prev.filter((_, rowIndex) => rowIndex !== index));
  };

  const patchRow = (index, key, value) => {
    setItems((prev) =>
      prev.map((row, rowIndex) =>
        rowIndex === index ? { ...row, [key]: value } : row
      )
    );
  };

  const validateItems = () => {
    const errors = items.map((item) => {
      const result = {};

      if (!item.product_id) {
        result.product_id = "Product ID is required.";
      }

      if (!item.quantity || Number(item.quantity) < 1) {
        result.quantity = "Quantity must be at least 1.";
      }

      return result;
    });

    setRowErrors(errors);
    return errors.every((error) => Object.keys(error).length === 0);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitError("");
    setSubmitting(true);

    const validRows = validateItems();

    if (!clientId || !dueDate || !validRows) {
      setSubmitError("Client, due date, and all item rows are required.");
      setSubmitting(false);
      return;
    }

    const payload = {
      client_id: Number(clientId),
      due_date: dueDate,
      items: items.map((item) => ({
        product_id: Number(item.product_id),
        quantity: Number(item.quantity),
      })),
    };

    try {
      const invoice = await createInvoice(payload);
      setCreatedInvoice(invoice);
      setItems([makeEmptyRow()]);
      setClientId("");
      setDueDate("");
      setRowErrors([]);
    } catch (error) {
      const normalized = normalizeApiError(error);
      setSubmitError(normalized.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAdmin) {
    return (
      <PageSection
        title="Create Invoice"
        description="Admin-only screen."
        actions={
          <Link to="/invoices">
            <Button variant="ghost">Back to Invoices</Button>
          </Link>
        }
      >
        <Alert variant="warning">
          Your role does not allow invoice creation from the UI.
        </Alert>
      </PageSection>
    );
  }

  return (
    <div className="stack-lg fade-in">
      <PageSection
        title="Create Invoice"
        description="Totals are never calculated client-side; backend returns subtotal/tax/total."
      >
        {loadError ? <Alert variant="danger">{loadError}</Alert> : null}
        {!productsSupported ? (
          <Alert variant="warning">
            Product list endpoint is unavailable. Enter product IDs manually.
          </Alert>
        ) : null}
        {clientsLoading || productsLoading ? (
          <Spinner label="Loading clients/products..." />
        ) : null}

        {!clientsLoading ? (
          <form className="stack-lg" onSubmit={handleSubmit}>
            {submitError ? <Alert variant="danger">{submitError}</Alert> : null}

            <div className="form-grid">
              <SelectInput
                id="invoice-client"
                label="Client"
                value={clientId}
                onChange={(event) => setClientId(event.target.value)}
                options={clientOptions}
                placeholder="Select a client"
              />

              <TextInput
                id="invoice-due-date"
                type="date"
                label="Due Date"
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
              />
            </div>

            <div className="stack-md">
              <div className="row-between">
                <h3>Invoice Items</h3>
                <Button variant="ghost" onClick={addRow}>
                  Add Row
                </Button>
              </div>

              {items.map((item, index) => (
                <div className="invoice-row" key={`item-row-${index}`}>
                  {productsSupported ? (
                    <SelectInput
                      id={`item-product-${index}`}
                      label="Product"
                      value={item.product_id}
                      onChange={(event) =>
                        patchRow(index, "product_id", event.target.value)
                      }
                      options={productOptions}
                      placeholder="Select product"
                      error={rowErrors[index]?.product_id}
                    />
                  ) : (
                    <TextInput
                      id={`item-product-${index}`}
                      type="number"
                      min="1"
                      label="Product ID"
                      value={item.product_id}
                      onChange={(event) =>
                        patchRow(index, "product_id", event.target.value)
                      }
                      error={rowErrors[index]?.product_id}
                    />
                  )}

                  <TextInput
                    id={`item-quantity-${index}`}
                    type="number"
                    min="1"
                    label="Quantity"
                    value={item.quantity}
                    onChange={(event) =>
                      patchRow(index, "quantity", event.target.value)
                    }
                    error={rowErrors[index]?.quantity}
                  />

                  <Button
                    variant="danger"
                    onClick={() => removeRow(index)}
                    disabled={items.length === 1}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>

            <div className="form-actions">
              <Button type="submit" loading={submitting}>
                Submit Invoice
              </Button>
              <Link to="/invoices">
                <Button variant="ghost">Cancel</Button>
              </Link>
            </div>
          </form>
        ) : null}
      </PageSection>

      {createdInvoice ? (
        <PageSection
          title="Created Invoice"
          description="Values below come directly from backend InvoiceResource."
        >
          <div className="created-invoice">
            <p>
              <strong>Invoice Number:</strong> {createdInvoice.invoice_number}
            </p>
            <p>
              <strong>Status:</strong> <Badge status={createdInvoice.status} />
            </p>
            <p>
              <strong>Subtotal:</strong>{" "}
              {formatCurrency(createdInvoice.financials?.subtotal)}
            </p>
            <p>
              <strong>Tax:</strong> {formatCurrency(createdInvoice.financials?.tax_amount)}
            </p>
            <p>
              <strong>Total:</strong> {formatCurrency(createdInvoice.financials?.total)}
            </p>
          </div>
        </PageSection>
      ) : null}
    </div>
  );
}
