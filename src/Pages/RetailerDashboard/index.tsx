import { Routes, Route, Navigate, NavLink } from "react-router";
import { useEffect, useState } from "react";
import RetailerOverview from "./pages/RetailerOverview.tsx";
import RetailerInventory from "./pages/RetailerInventory.tsx";
import RetailerShops from "./pages/RetailerShops.tsx";
import RetailerDistributions from "./pages/RetailerDistributions.tsx";
import RetailerReports from "./pages/RetailerReports.tsx";
import RetailerProfile from "./pages/RetailerProfile.tsx";
import { RetailerAPI } from "@/lib/api";
import RetailerHeader from "./Header";

export default function RetailerDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [brand, setBrand] = useState<string>("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const p = await RetailerAPI.profile.get();
        if (!mounted) return;
        const name = (p?.companyName as string) || (p?.name as string) || "";
        setBrand(name);
      } catch {
        // non-fatal: keep default fallback label
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);
  return (
    <div className="min-h-screen bg-app-gradient">
      {/* Simple sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-40 w-72 p-4 transition-transform md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } glass-card rounded-none overflow-y-auto h-screen`}
        aria-hidden={!sidebarOpen && undefined}
      >
        <div className="flex items-center justify-between mb-6">
          <div
            className="text-xl font-bold text-brand-gradient"
            title={brand || undefined}
          >
            {brand || "Dashboard"}
          </div>
          <button className="md:hidden" onClick={() => setSidebarOpen(false)}>
            ✕
          </button>
        </div>
        <nav className="space-y-2">
          <NavLink
            to="/retailer-dashboard"
            end
            className={({ isActive }) =>
              `block px-3 py-2 rounded-md hover:bg-muted/40 ${
                isActive ? "bg-muted/50 font-medium" : ""
              }`
            }
          >
            Overview
          </NavLink>
          <NavLink
            to="/retailer-dashboard/inventory"
            className={({ isActive }) =>
              `block px-3 py-2 rounded-md hover:bg-muted/40 ${
                isActive ? "bg-muted/50 font-medium" : ""
              }`
            }
          >
            Inventory
          </NavLink>
          <NavLink
            to="/retailer-dashboard/shops"
            className={({ isActive }) =>
              `block px-3 py-2 rounded-md hover:bg-muted/40 ${
                isActive ? "bg-muted/50 font-medium" : ""
              }`
            }
          >
            Shops & Network
          </NavLink>
          <NavLink
            to="/retailer-dashboard/distributions"
            className={({ isActive }) =>
              `block px-3 py-2 rounded-md hover:bg-muted/40 ${
                isActive ? "bg-muted/50 font-medium" : ""
              }`
            }
          >
            Distributions
          </NavLink>
          <NavLink
            to="/retailer-dashboard/reports"
            className={({ isActive }) =>
              `block px-3 py-2 rounded-md hover:bg-muted/40 ${
                isActive ? "bg-muted/50 font-medium" : ""
              }`
            }
          >
            Reports
          </NavLink>
          <NavLink
            to="/retailer-dashboard/profile"
            className={({ isActive }) =>
              `block px-3 py-2 rounded-md hover:bg-muted/40 ${
                isActive ? "bg-muted/50 font-medium" : ""
              }`
            }
          >
            Profile
          </NavLink>
        </nav>
      </div>

      <div className="md:ml-72 min-h-screen flex flex-col">
        <RetailerHeader setSidebarOpen={setSidebarOpen} />

        <main className="p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <Routes>
              <Route index element={<RetailerOverview />} />
              <Route path="inventory" element={<RetailerInventory />} />
              <Route path="shops" element={<RetailerShops />} />
              <Route path="distributions" element={<RetailerDistributions />} />
              <Route path="reports" element={<RetailerReports />} />
              <Route path="profile" element={<RetailerProfile />} />
              <Route path="*" element={<Navigate to="." replace />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
}
