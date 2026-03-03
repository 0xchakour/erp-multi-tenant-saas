import { useCallback, useEffect, useMemo, useState } from "react";
import PageSection from "../../components/shared/PageSection";
import Spinner from "../../components/ui/Spinner";
import Alert from "../../components/ui/Alert";
import Button from "../../components/ui/Button";
import TextInput from "../../components/ui/TextInput";
import EmptyState from "../../components/ui/EmptyState";
import Pagination from "../../components/ui/Pagination";
import {
  createClient,
  deleteClient,
  listClients,
  updateClient,
} from "../../services/client.service";
import { firstFieldError, normalizeApiError } from "../../services/error-utils";
import { useAuth } from "../../hooks/useAuth";

const EMPTY_FORM = {
  name: "",
  email: "",
  phone: "",
  address: "",
};

export default function Clients() {
  const { isAdmin } = useAuth();

  const [clients, setClients] = useState([]);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState("");

  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [createError, setCreateError] = useState("");
  const [createSuccess, setCreateSuccess] = useState("");
  const [creating, setCreating] = useState(false);

  const [editingClientId, setEditingClientId] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [editErrors, setEditErrors] = useState({});
  const [editError, setEditError] = useState("");
  const [editSuccess, setEditSuccess] = useState("");
  const [updating, setUpdating] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const loadClients = useCallback(async () => {
    setLoading(true);
    setListError("");

    try {
      const rows = await listClients();
      setClients(rows);
    } catch (error) {
      setListError(normalizeApiError(error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

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
      await createClient(form);
      setCreateSuccess("Client created.");
      setForm(EMPTY_FORM);
      await loadClients();
    } catch (error) {
      const normalized = normalizeApiError(error);
      setCreateError(normalized.message);
      setFormErrors(normalized.validationErrors);
    } finally {
      setCreating(false);
    }
  };

  const startEditing = (client) => {
    setEditingClientId(client.id);
    setEditForm({
      name: client.name ?? "",
      email: client.email ?? "",
      phone: client.phone ?? "",
      address: client.address ?? "",
    });
    setEditErrors({});
    setEditError("");
    setEditSuccess("");
  };

  const cancelEditing = () => {
    setEditingClientId(null);
    setEditForm(EMPTY_FORM);
    setEditErrors({});
    setEditError("");
    setEditSuccess("");
  };

  const handleUpdate = async (event) => {
    event.preventDefault();
    if (!editingClientId) {
      return;
    }

    setUpdating(true);
    setEditError("");
    setEditSuccess("");
    setEditErrors({});

    try {
      await updateClient(editingClientId, editForm);
      setEditSuccess("Client updated.");
      await loadClients();
    } catch (error) {
      const normalized = normalizeApiError(error);
      setEditError(normalized.message);
      setEditErrors(normalized.validationErrors);
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (clientId) => {
    const confirmed = window.confirm("Delete this client?");

    if (!confirmed) {
      return;
    }

    setDeletingId(clientId);
    setListError("");

    try {
      await deleteClient(clientId);
      if (editingClientId === clientId) {
        cancelEditing();
      }
      await loadClients();
    } catch (error) {
      setListError(normalizeApiError(error).message);
    } finally {
      setDeletingId(null);
    }
  };

  const filteredClients = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return clients;
    }

    return clients.filter((client) =>
      [client.name, client.email, client.phone, client.address]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedQuery))
    );
  }, [clients, query]);

  const totalPages = Math.max(1, Math.ceil(filteredClients.length / pageSize));

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const paginatedClients = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredClients.slice(start, start + pageSize);
  }, [filteredClients, page, pageSize]);

  return (
    <div className="stack-lg fade-in">
      <PageSection
        title="Clients"
        description="Tenant-scoped client directory from /clients."
      >
        {loading ? <Spinner label="Loading clients..." /> : null}
        {!loading && listError ? <Alert variant="danger">{listError}</Alert> : null}

        {!loading && !listError ? (
          <>
            <div className="table-toolbar">
              <div className="toolbar-left">
                <TextInput
                  id="clients-search"
                  label="Search"
                  className="toolbar-search"
                  placeholder="Name, email, phone, address..."
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </div>
              <div className="toolbar-right">
                <p className="toolbar-summary">
                  {filteredClients.length} result{filteredClients.length === 1 ? "" : "s"}
                </p>
              </div>
            </div>

            {filteredClients.length === 0 ? (
              <EmptyState
                title="No clients match your filters"
                description="Try a different search term or create a new client."
              />
            ) : (
              <>
                <div className="table-shell">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Address</th>
                        {isAdmin ? <th>Actions</th> : null}
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedClients.map((client) => (
                        <tr key={client.id}>
                          <td>{client.name}</td>
                          <td>{client.email || "-"}</td>
                          <td>{client.phone || "-"}</td>
                          <td>{client.address || "-"}</td>
                          {isAdmin ? (
                            <td className="row-actions">
                              <Button variant="ghost" onClick={() => startEditing(client)}>
                                Edit
                              </Button>
                              <Button
                                variant="danger"
                                onClick={() => handleDelete(client.id)}
                                loading={deletingId === client.id}
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
                  totalItems={filteredClients.length}
                  pageSize={pageSize}
                  onPageChange={setPage}
                  onPageSizeChange={setPageSize}
                />
              </>
            )}
          </>
        ) : null}
      </PageSection>

      {isAdmin && editingClientId ? (
        <PageSection
          title="Edit Client"
          description="Update an existing client record."
        >
          <form className="form-grid" onSubmit={handleUpdate}>
            {editError ? <Alert variant="danger">{editError}</Alert> : null}
            {editSuccess ? <Alert variant="success">{editSuccess}</Alert> : null}

            <TextInput
              id="edit-client-name"
              label="Name"
              placeholder="Acme LLC"
              value={editForm.name}
              onChange={(event) =>
                setEditForm((prev) => ({ ...prev, name: event.target.value }))
              }
              error={firstFieldError(editErrors, "name")}
            />
            <TextInput
              id="edit-client-email"
              type="email"
              label="Email"
              placeholder="billing@acme.com"
              value={editForm.email}
              onChange={(event) =>
                setEditForm((prev) => ({ ...prev, email: event.target.value }))
              }
              error={firstFieldError(editErrors, "email")}
            />
            <TextInput
              id="edit-client-phone"
              label="Phone"
              placeholder="+1 555 123 4567"
              value={editForm.phone}
              onChange={(event) =>
                setEditForm((prev) => ({ ...prev, phone: event.target.value }))
              }
              error={firstFieldError(editErrors, "phone")}
            />
            <TextInput
              id="edit-client-address"
              label="Address"
              placeholder="Street, city, country"
              value={editForm.address}
              onChange={(event) =>
                setEditForm((prev) => ({ ...prev, address: event.target.value }))
              }
              error={firstFieldError(editErrors, "address")}
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
        title="Create Client"
        description="Only admin users can create clients (ClientPolicy.create)."
      >
        {!isAdmin ? (
          <Alert variant="warning">
            Your role is read-only for client creation.
          </Alert>
        ) : (
          <form className="form-grid" onSubmit={handleCreate}>
            {createError ? <Alert variant="danger">{createError}</Alert> : null}
            {createSuccess ? <Alert variant="success">{createSuccess}</Alert> : null}

            <TextInput
              id="client-name"
              label="Name"
              placeholder="Acme LLC"
              value={form.name}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, name: event.target.value }))
              }
              error={firstFieldError(formErrors, "name")}
            />
            <TextInput
              id="client-email"
              type="email"
              label="Email"
              placeholder="billing@acme.com"
              value={form.email}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, email: event.target.value }))
              }
              error={firstFieldError(formErrors, "email")}
            />
            <TextInput
              id="client-phone"
              label="Phone"
              placeholder="+1 555 123 4567"
              value={form.phone}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, phone: event.target.value }))
              }
              error={firstFieldError(formErrors, "phone")}
            />
            <TextInput
              id="client-address"
              label="Address"
              placeholder="Street, city, country"
              value={form.address}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, address: event.target.value }))
              }
              error={firstFieldError(formErrors, "address")}
            />

            <div className="form-actions">
              <Button type="submit" loading={creating}>
                Create Client
              </Button>
            </div>
          </form>
        )}
      </PageSection>
    </div>
  );
}
