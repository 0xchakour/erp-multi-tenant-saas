import { createBrowserRouter } from "react-router-dom";
import Login from "../pages/auth/Login";
import DashboardLayout from "../layouts/DashboardLayout";
import DashboardHome from "../pages/dashboard/DashboardHome";
import ProtectedRoute from "../components/shared/ProtectedRoute";
import Clients from "../pages/dashboard/Clients";
import Products from "../pages/dashboard/Products";
import Invoices from "../pages/dashboard/Invoices";
import InvoiceCreate from "../pages/dashboard/InvoiceCreate";
import InvoiceDetails from "../pages/dashboard/InvoiceDetails";
import Reports from "../pages/dashboard/Reports";
import Billing from "../pages/dashboard/Billing";
import LandingPage from "../pages/public/LandingPage";
import OnboardingWizard from "../pages/public/OnboardingWizard";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <LandingPage />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/onboarding",
    element: <OnboardingWizard />,
  },
  {
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: "/dashboard",
        element: <DashboardHome />,
      },
      {
        path: "/clients",
        element: <Clients />,
      },
      {
        path: "/products",
        element: <Products />,
      },
      {
        path: "/invoices",
        element: <Invoices />,
      },
      {
        path: "/invoices/new",
        element: <InvoiceCreate />,
      },
      {
        path: "/invoices/:invoiceId",
        element: <InvoiceDetails />,
      },
      {
        path: "/reports",
        element: <Reports />,
      },
      {
        path: "/billing",
        element: <Billing />,
      },
    ],
  },
]);
