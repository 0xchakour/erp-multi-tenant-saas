import { Navigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import AuthLoadingScreen from "./AuthLoadingScreen";

export default function ProtectedRoute({ children }) {
  const { loading, isAuthenticated } = useAuth();

  if (loading) {
    return <AuthLoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
}
