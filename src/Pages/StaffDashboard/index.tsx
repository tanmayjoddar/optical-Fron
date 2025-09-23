import { Routes, Route, Navigate } from "react-router";
import StaffLayout from "./Layout/StaffLayout";
import DashboardOverview from "./DashboardOverview";
import PatientsList from "./Patients/PatientsList";
import PatientCreate from "./Patients/PatientCreate";
import PatientDetails from "./Patients/PatientDetails";
import PatientEdit from "./Patients/PatientEdit";
import CustomersList from "./Customers/CustomersList";
import CustomerCreate from "./Customers/CustomerCreate";
import CustomerDetails from "./Customers/CustomerDetails";
import InventoryList from "./Inventory/InventoryList";
import ProductCreate from "./Inventory/ProductCreate";
import StockMovements from "./Inventory/StockMovements";
import BarcodeOperations from "./Barcode/BarcodeOperations";
import InvoicesList from "./Invoices/InvoicesList";
import InvoiceCreate from "./Invoices/InvoiceCreate";
import PrescriptionsList from "./Prescriptions/PrescriptionsList";
import PrescriptionCreate from "./Prescriptions/PrescriptionCreate";
import Reports from "./Reports/Reports";
import StockReceipts from "./StockReceipts/StockReceipts";

const StaffDashboard = () => {
  return (
    <StaffLayout>
      <Routes>
        {/* Dashboard Overview */}
        <Route index element={<DashboardOverview />} />
        
        {/* Patient Management */}
        <Route path="patients" element={<PatientsList />} />
        <Route path="patients/create" element={<PatientCreate />} />
        <Route path="patients/:id" element={<PatientDetails />} />
        <Route path="patients/:id/edit" element={<PatientEdit />} />
        
        {/* Customer Management */}
        <Route path="customers" element={<CustomersList />} />
        <Route path="customers/create" element={<CustomerCreate />} />
        <Route path="customers/:id" element={<CustomerDetails />} />
        
        {/* Inventory Management */}
        <Route path="inventory" element={<InventoryList />} />
        <Route path="inventory/products/create" element={<ProductCreate />} />
        <Route path="inventory/stock-movements" element={<StockMovements />} />
        
        {/* Barcode Operations */}
        <Route path="barcode" element={<BarcodeOperations />} />
        
        {/* Invoice Management */}
        <Route path="invoices" element={<InvoicesList />} />
        <Route path="invoices/create" element={<InvoiceCreate />} />
        
        {/* Prescription Management */}
        <Route path="prescriptions" element={<PrescriptionsList />} />
        <Route path="prescriptions/create" element={<PrescriptionCreate />} />

  {/* Reports */}
  <Route path="reports" element={<Reports />} />


  {/* Stock Receipts */}
  <Route path="stock-receipts" element={<StockReceipts />} />

        
        {/* Catch all - redirect to dashboard */}
        <Route path="*" element={<Navigate to="/staff-dashboard" replace />} />
      </Routes>
    </StaffLayout>
  );
};

export default StaffDashboard;