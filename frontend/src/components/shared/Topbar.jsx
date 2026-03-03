import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import Button from "../ui/Button";
import BrandLogo from "./BrandLogo";

function resolvePageTitle(pathname) {
  if (pathname === "/dashboard") {
    return "Dashboard";
  }
  if (pathname.startsWith("/clients")) {
    return "Clients";
  }
  if (pathname.startsWith("/products")) {
    return "Products";
  }
  if (pathname === "/invoices/new") {
    return "Create Invoice";
  }
  if (pathname.startsWith("/invoices/")) {
    return "Invoice Details";
  }
  if (pathname.startsWith("/invoices")) {
    return "Invoices";
  }
  if (pathname.startsWith("/billing")) {
    return "Billing";
  }
  if (pathname.startsWith("/reports")) {
    return "Reports";
  }

  return "Operations Console";
}

export default function Topbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const pageTitle = resolvePageTitle(pathname);
  const today = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(
    new Date()
  );
  const handleLogout = async () => {
    await logout();
    navigate("/", { replace: true });
  };

  return (
    <header className="topbar">
      <div className="topbar-context">
        <BrandLogo size={36} withWordmark={false} tone="light" className="topbar-logo" />
        <div>
          <p className="topbar-caption">Tenant Scope</p>
          <h1 className="topbar-title">{pageTitle}</h1>
          <p className="topbar-meta">Operations Console | {today}</p>
        </div>
      </div>

      <div className="topbar-actions">
        <div className="identity-pill">
          <span>{user?.name ?? "Unknown User"}</span>
          <span className="identity-role">{user?.role ?? "unknown"}</span>
        </div>
        <Button variant="ghost" onClick={handleLogout}>
          Logout
        </Button>
      </div>
    </header>
  );
}
