import { Routes, Route, Navigate } from "react-router-dom";
import { useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import DashboardOverview from "./DashboardOverview";
import GrowthChart from "./GrowthChart";
import RecentActivities from "./RecentActivities";
import SalesReport from "./Reports/SalesReport";
import ProductSalesReport from "./Reports/ProductSalesReport";
import InventoryReport from "./Reports/InventoryReport";
import LowStockAlerts from "./Reports/LowStockAlerts";
import PatientReport from "./Reports/PatientReport";
import PatientVisitHistory from "./Reports/PatientVisitHistory";
import StaffList from "./Staff/StaffList";
import StaffDetails from "./Staff/StaffDetails";
import StaffActivities from "./Staff/StaffActivities";

export default function ShopAdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="md:ml-80">
        <Header setSidebarOpen={setSidebarOpen} />
        <main className="p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <Routes>
              <Route path="" element={<DashboardOverview />} />
              <Route path="growth" element={<GrowthChart />} />
              <Route path="activities" element={<RecentActivities />} />
              <Route path="reports/sales" element={<SalesReport />} />
              <Route path="reports/products" element={<ProductSalesReport />} />
              <Route path="reports/inventory" element={<InventoryReport />} />
              <Route path="reports/low-stock" element={<LowStockAlerts />} />
              <Route path="reports/patients" element={<PatientReport />} />
              <Route path="reports/patients/visits" element={<PatientVisitHistory />} />
              <Route path="staff" element={<StaffList />} />
              <Route path="staff/:staffId" element={<StaffDetails />} />
              <Route path="staff/:staffId/activities" element={<StaffActivities />} />
              <Route path="*" element={<Navigate to="." />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
}
