import { Outlet } from "react-router-dom";
import Sidebar from "../components/shared/Sidebar";
import Topbar from "../components/shared/Topbar";
import SubscriptionBanner from "../components/shared/SubscriptionBanner";

export default function DashboardLayout() {
  return (
    <div className="app-shell">
      <Sidebar />

      <div className="app-main">
        <Topbar />
        <SubscriptionBanner />

        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
