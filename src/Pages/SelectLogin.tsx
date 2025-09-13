import { useNavigate } from "react-router";
import { useEffect } from "react";
import { useAuth } from "../hooks/useAuth";

function SelectLogin() {
  const navigate = useNavigate();
  const { token, type } = useAuth();

  useEffect(() => {
    if (token && type) {
      if (type === "staff") {
        navigate("/staff-dashboard", { replace: true });
      } else if (type === "shopAdmin") {
        navigate("/shop-admin-dashboard", { replace: true });
      }
      // Add more user types here as needed
    }
  }, [token, type, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-300 px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 space-y-6">
        <h2 className="text-2xl font-bold text-center mb-6">Select Login Type</h2>
        <div className="space-y-4">
          <button
            className="w-full py-3 px-4 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
            onClick={() => navigate("/staff-login")}
          >
            Staff Login
          </button>
          <button
            className="w-full py-3 px-4 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 transition"
            onClick={() => navigate("/shop-admin-login")}
          >
            Shop Admin Login
          </button>
          <button
            className="w-full py-3 px-4 rounded-lg bg-yellow-600 text-white font-semibold hover:bg-yellow-700 transition"
            disabled
          >
            Retailer Login (Coming Soon)
          </button>
          <button
            className="w-full py-3 px-4 rounded-lg bg-gray-600 text-white font-semibold hover:bg-gray-700 transition"
            disabled
          >
            Admin Login (Coming Soon)
          </button>
        </div>
      </div>
    </div>
  );
}

export default SelectLogin;
