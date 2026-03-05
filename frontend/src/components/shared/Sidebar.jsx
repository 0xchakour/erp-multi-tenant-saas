import { NavLink } from "react-router-dom";
import BrandLogo from "./BrandLogo";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", end: true },
  { to: "/clients", label: "Clients", end: false },
  { to: "/products", label: "Products", end: false },
  { to: "/invoices", label: "Invoices", end: false },
  { to: "/billing", label: "Billing", end: false },
  { to: "/reports", label: "Reports", end: false },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand-wrap">
        <BrandLogo
          size={46}
          tone="dark"
          title="Nexora ERP"
          subtitle="Operations Suite"
        />
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `nav-link ${isActive ? "nav-link-active" : ""}`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
