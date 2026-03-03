import { useCallback, useEffect, useMemo, useState } from "react";
import PageSection from "../../components/shared/PageSection";
import Alert from "../../components/ui/Alert";
import Spinner from "../../components/ui/Spinner";
import TextInput from "../../components/ui/TextInput";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";
import Pagination from "../../components/ui/Pagination";
import {
  createProduct,
  deleteProduct,
  listProducts,
  updateProduct,
} from "../../services/product.service";
import { firstFieldError, normalizeApiError } from "../../services/error-utils";
import { hasContractEndpoint } from "../../services/backend-contract";
import { useAuth } from "../../hooks/useAuth";

const EMPTY_PRODUCT_FORM = {
  name: "",
  sku: "",
  price: "",
};

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(Number(value ?? 0));
}

export default function Products() {
  const { isAdmin } = useAuth();

  const [products, setProducts] = useState([]);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState("");

  const [form, setForm] = useState(EMPTY_PRODUCT_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [createError, setCreateError] = useState("");
  const [createSuccess, setCreateSuccess] = useState("");
  const [creating, setCreating] = useState(false);

  const [editingProductId, setEditingProductId] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_PRODUCT_FORM);
  const [editErrors, setEditErrors] = useState({});
  const [editError, setEditError] = useState("");
  const [editSuccess, setEditSuccess] = useState("");
  const [updating, setUpdating] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const productsSupported = hasContractEndpoint("products", "list");
  const createSupported = hasContractEndpoint("products", "create");

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setListError("");

    try {
      const rows = await listProducts();
      setProducts(rows);
    } catch (error) {
      setListError(normalizeApiError(error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    setPage(1);
  }, [query, pageSize]);

  const handleCreate = async (event) => {
    event.preventDefault();
    setCreating(true);
    setCreateError("");
    setCreateSuccess("");
    setFormErrors({});

    try {
      await createProduct({
        ...form,
        price: Number(form.price),
      });

      setCreateSuccess("Product created.");
      setForm(EMPTY_PRODUCT_FORM);
      await loadProducts();
    } catch (error) {
      const normalized = normalizeApiError(error);
      setCreateError(normalized.message);
      setFormErrors(normalized.validationErrors);
    } finally {
      setCreating(false);
    }
  };

  const startEditing = (product) => {
    setEditingProductId(product.id);
    setEditForm({
      name: product.name ?? "",
      sku: product.sku ?? "",
      price: String(product.price ?? ""),
    });
    setEditErrors({});
    setEditError("");
    setEditSuccess("");
  };

  const cancelEditing = () => {
    setEditingProductId(null);
    setEditForm(EMPTY_PRODUCT_FORM);
    setEditErrors({});
    setEditError("");
    setEditSuccess("");
  };

  const handleUpdate = async (event) => {
    event.preventDefault();
    if (!editingProductId) {
      return;
    }

    setUpdating(true);
    setEditError("");
    setEditSuccess("");
    setEditErrors({});

    try {
      await updateProduct(editingProductId, {
        ...editForm,
        price: Number(editForm.price),
      });
      setEditSuccess("Product updated.");
      await loadProducts();
    } catch (error) {
      const normalized = normalizeApiError(error);
      setEditError(normalized.message);
      setEditErrors(normalized.validationErrors);
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (productId) => {
    const confirmed = window.confirm("Delete this product?");

    if (!confirmed) {
      return;
    }

    setDeletingId(productId);
    setListError("");

    try {
      await deleteProduct(productId);
      if (editingProductId === productId) {
        cancelEditing();
      }
      await loadProducts();
    } catch (error) {
      setListError(normalizeApiError(error).message);
    } finally {
      setDeletingId(null);
    }
  };

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return products;
    }

    return products.filter((product) =>
      [product.name, product.sku, product.price]
        .filter((value) => value !== null && value !== undefined)
        .some((value) => String(value).toLowerCase().includes(normalizedQuery))
    );
  }, [products, query]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const paginatedProducts = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, page, pageSize]);

  return (
    <div className="stack-lg fade-in">
      <PageSection
        title="Products"
        description="Product module mapped strictly to extracted API contract."
      >
        {!productsSupported ? (
          <Alert variant="warning">
            Product list endpoint is not available in backend contract.
          </Alert>
        ) : null}

        {loading ? <Spinner label="Loading products..." /> : null}
        {!loading && listError ? <Alert variant="danger">{listError}</Alert> : null}

        {!loading && !listError && productsSupported ? (
          <>
            <div className="table-toolbar">
              <div className="toolbar-left">
                <TextInput
                  id="products-search"
                  label="Search"
                  className="toolbar-search"
                  placeholder="Name, SKU, price..."
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </div>
              <div className="toolbar-right">
                <p className="toolbar-summary">
                  {filteredProducts.length} result{filteredProducts.length === 1 ? "" : "s"}
                </p>
              </div>
            </div>

            {filteredProducts.length === 0 ? (
              <EmptyState
                title="No products match your filters"
                description="Try another keyword or create a product."
              />
            ) : (
              <>
                <div className="table-shell">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>SKU</th>
                        <th>Price</th>
                        {isAdmin ? <th>Actions</th> : null}
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedProducts.map((product) => (
                        <tr key={product.id}>
                          <td>{product.name}</td>
                          <td>{product.sku}</td>
                          <td>{formatCurrency(product.price)}</td>
                          {isAdmin ? (
                            <td className="row-actions">
                              <Button variant="ghost" onClick={() => startEditing(product)}>
                                Edit
                              </Button>
                              <Button
                                variant="danger"
                                onClick={() => handleDelete(product.id)}
                                loading={deletingId === product.id}
                              >
                                Delete
                              </Button>
                            </td>
                          ) : null}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <Pagination
                  page={page}
                  totalPages={totalPages}
                  totalItems={filteredProducts.length}
                  pageSize={pageSize}
                  onPageChange={setPage}
                  onPageSizeChange={setPageSize}
                />
              </>
            )}
          </>
        ) : null}
      </PageSection>

      {isAdmin && editingProductId ? (
        <PageSection
          title="Edit Product"
          description="Update an existing product."
        >
          <form className="form-grid" onSubmit={handleUpdate}>
            {editError ? <Alert variant="danger">{editError}</Alert> : null}
            {editSuccess ? <Alert variant="success">{editSuccess}</Alert> : null}

            <TextInput
              id="edit-product-name"
              label="Name"
              placeholder="Consulting Package"
              value={editForm.name}
              onChange={(event) =>
                setEditForm((prev) => ({ ...prev, name: event.target.value }))
              }
              error={firstFieldError(editErrors, "name")}
            />
            <TextInput
              id="edit-product-sku"
              label="SKU"
              placeholder="CONSULT-001"
              value={editForm.sku}
              onChange={(event) =>
                setEditForm((prev) => ({ ...prev, sku: event.target.value }))
              }
              error={firstFieldError(editErrors, "sku")}
            />
            <TextInput
              id="edit-product-price"
              type="number"
              step="0.01"
              min="0"
              label="Price"
              placeholder="100.00"
              value={editForm.price}
              onChange={(event) =>
                setEditForm((prev) => ({ ...prev, price: event.target.value }))
              }
              error={firstFieldError(editErrors, "price")}
            />

            <div className="form-actions">
              <Button type="submit" loading={updating}>
                Save Changes
              </Button>
              <Button variant="ghost" onClick={cancelEditing}>
                Cancel
              </Button>
            </div>
          </form>
        </PageSection>
      ) : null}

      <PageSection
        title="Create Product"
        description="Admin-only action. Subscription-limit errors are surfaced from backend 403 messages."
      >
        {!isAdmin ? (
          <Alert variant="warning">
            Your role is read-only for product creation.
          </Alert>
        ) : !createSupported ? (
          <Alert variant="warning">
            Product creation endpoint is not available in backend contract.
          </Alert>
        ) : (
          <form className="form-grid" onSubmit={handleCreate}>
            {createError ? <Alert variant="danger">{createError}</Alert> : null}
            {createSuccess ? <Alert variant="success">{createSuccess}</Alert> : null}

            <TextInput
              id="product-name"
              label="Name"
              placeholder="Consulting Package"
              value={form.name}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, name: event.target.value }))
              }
              error={firstFieldError(formErrors, "name")}
            />
            <TextInput
              id="product-sku"
              label="SKU"
              placeholder="CONSULT-001"
              value={form.sku}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, sku: event.target.value }))
              }
              error={firstFieldError(formErrors, "sku")}
            />
            <TextInput
              id="product-price"
              type="number"
              step="0.01"
              min="0"
              label="Price"
              placeholder="100.00"
              value={form.price}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, price: event.target.value }))
              }
              error={firstFieldError(formErrors, "price")}
            />

            <div className="form-actions">
              <Button type="submit" loading={creating}>
                Create Product
              </Button>
            </div>
          </form>
        )}
      </PageSection>
    </div>
  );
}
