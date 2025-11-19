// Combined login is handled in Login
import StaffDashboard from "./Pages/StaffDashboard/index";
import Login from "./Pages/SelectLogin"; // renamed component exported as Login
import ShopAdminRegister from "./Pages/ShopAdminRegister";
import RetailerDashboard from "./Pages/RetailerDashboard";
import DoctorDashboard from "./Pages/DoctorDashboard";
import { Routes, Route, Navigate } from "react-router";
import { useAuth } from "./hooks/useAuth";
import ShopAdminDashboard from "./Pages/ShopAdminDashboard/index";

interface ProtectedRouteProps {
  children: React.ReactNode;
  type: string;
}

function ProtectedRoute({ children, type }: ProtectedRouteProps) {
  const { token, type: userType, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] text-sm text-muted-foreground">
        Authenticating...
      </div>
    );
  }

  if (!token || userType !== type) {
    // Provide role-specific unauthorized flag & intended redirect
    const redirectPath = encodeURIComponent(
      window.location.pathname + window.location.search
    );
    return (
      <Navigate
        to={`/?unauthorized=${type}&redirect=${redirectPath}`}
        replace
      />
    );
  }
  return <>{children}</>;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/shop-admin-register" element={<ShopAdminRegister />} />
      <Route
        path="/staff-dashboard/*"
        element={
          <ProtectedRoute type="staff">
            <StaffDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/shop-admin-dashboard/*"
        element={
          <ProtectedRoute type="shopAdmin">
            <ShopAdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/retailer-dashboard/*"
        element={
          <ProtectedRoute type="retailer">
            <RetailerDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/doctor-dashboard/*"
        element={
          <ProtectedRoute type="doctor">
            <DoctorDashboard />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
