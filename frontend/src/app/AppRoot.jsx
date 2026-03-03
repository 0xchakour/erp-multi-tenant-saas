import { RouterProvider } from "react-router-dom";
import { router } from "./router";
import { AuthProvider } from "../context/AuthContext";
import { SubscriptionProvider } from "../context/SubscriptionContext";

export default function AppRoot() {
  return (
    <AuthProvider>
      <SubscriptionProvider>
        <RouterProvider router={router} />
      </SubscriptionProvider>
    </AuthProvider>
  );
}
