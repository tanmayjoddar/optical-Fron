import { Suspense, lazy } from 'react';
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
import CustomerHotspots from "./Customers/CustomerHotspots";
import CustomerInvoiceCreate from "./Customers/CustomerInvoiceCreate";
import ProductCreate from "./Inventory/ProductCreate";
import ProductDetail from "./Inventory/ProductDetail";
import StockMovements from "./Inventory/StockMovements";
import QuickStockUpdate from "./Inventory/QuickStockUpdate";
import ProductBarcodeLookup from "./Inventory/ProductBarcodeLookup";
import BarcodeOperations from "./Barcode/BarcodeOperations";
import BarcodeGenerate from "./Barcode/BarcodeGenerate";
import ProductBarcodeGenerator from "./Barcode/ProductBarcodeGenerator";
import ProductSkuGenerator from "./Barcode/ProductSkuGenerator";
import MissingBarcodes from "./Barcode/MissingBarcodes";
import InvoicesList from "./Invoices/InvoicesList";
import InvoiceCreate from "./Invoices/InvoiceCreate";
import PrescriptionsList from "./Prescriptions/PrescriptionsList";
import PrescriptionCreate from "./Prescriptions/PrescriptionCreate";
import Reports from "./Reports/Reports";
import StockReceipts from "./StockReceipts/StockReceipts";
import StockReceiptCreate from "./StockReceipts/StockReceiptCreate";
import MyAttendance from "./Attendance/MyAttendance";
import GiftCardIssue from "./GiftCards/GiftCardIssue";
import GiftCardRedeem from "./GiftCards/GiftCardRedeem";
import GiftCardBalance from "./GiftCards/GiftCardBalance";
import GiftCards from "./GiftCards/GiftCards";
import ProductsList from "./Inventory/ProductsList"; // added
import InventoryOverviewPage from "./Inventory/InventoryOverview"; // new overview page
import ProductEdit from "./Inventory/ProductEdit"; // added
import StockInPage from "./Inventory/StockInPage.tsx"; // new stock in page wrapper
import StockOutPage from "./Inventory/StockOutPage"; // unified stock out page
import CompanyCreatePage from "./Inventory/CompanyCreatePage"; // company create page
import CompanyListPage from "./Inventory/CompanyListPage"; // companies list page
import CompanyProductsPage from "./Inventory/CompanyProductsPage"; // company products page

// Lazy loaded pages (new additions)
const InvoiceDetailLazy = lazy(() => import('./Invoices/InvoiceDetail'));

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

        {/* Attendance */}
        <Route path="attendance" element={<MyAttendance />} />

        {/* Customer Management */}
        <Route path="customers" element={<CustomersList />} />
        <Route path="customers/create" element={<CustomerCreate />} />
        <Route path="customers/create-invoice" element={<CustomerInvoiceCreate />} />
        <Route path="customers/:id" element={<CustomerDetails />} />
        <Route path="customers/hotspots" element={<CustomerHotspots />} />

        {/* Inventory Management */}
  <Route path="inventory" element={<InventoryOverviewPage />} /> {/* overview as primary landing */}
  <Route path="inventory/overview" element={<InventoryOverviewPage />} />
        <Route path="inventory/products" element={<ProductsList />} /> {/* explicit products path */}
        <Route path="inventory/products/create" element={<ProductCreate />} />
        <Route path="inventory/products/new" element={<ProductCreate />} /> {/* new product route */}
        <Route path="inventory/products/:id" element={<ProductDetail />} />
        <Route path="inventory/products/:id/edit" element={<ProductEdit />} /> {/* edit route */}
        <Route path="inventory/stock-movements" element={<StockMovements />} />
        <Route path="inventory/quick-stock" element={<QuickStockUpdate />} />
  <Route path="inventory/stock-out" element={<StockOutPage />} />
  <Route path="inventory/lookup-barcode" element={<ProductBarcodeLookup />} />
  <Route path="inventory/stock-in" element={<StockInPage />} />
  <Route path="inventory/companies/new" element={<CompanyCreatePage />} />
  <Route path="inventory/companies" element={<CompanyListPage />} />
  <Route path="inventory/companies/:companyId/products" element={<CompanyProductsPage />} />

        {/* Barcode Operations */}
        <Route path="barcode" element={<BarcodeOperations />} />
        <Route path="barcode/generate" element={<BarcodeGenerate />} />
        <Route path="barcode/assign" element={<ProductBarcodeGenerator />} />
        <Route path="barcode/sku" element={<ProductSkuGenerator />} />
        <Route path="barcode/missing" element={<MissingBarcodes />} />

        {/* Invoice Management */}
        <Route path="invoices" element={<InvoicesList />} />
    <Route path="invoices/create" element={<InvoiceCreate />} />
    <Route path="invoices/:id" element={<Suspense fallback={<>Loading...</>}><InvoiceDetailLazy /></Suspense>} />

        {/* Prescription Management */}
        <Route path="prescriptions" element={<PrescriptionsList />} />
        <Route path="prescriptions/create" element={<PrescriptionCreate />} />

        {/* Reports */}
        <Route path="reports" element={<Reports />} />

        {/* Gift Cards */}
  <Route path="gift-cards" element={<GiftCards />} />
        <Route path="gift-cards/issue" element={<GiftCardIssue />} />
        <Route path="gift-cards/redeem" element={<GiftCardRedeem />} />
        <Route path="gift-cards/balance" element={<GiftCardBalance />} />

        {/* Stock Receipts */}
        <Route path="stock-receipts" element={<StockReceipts />} />
        <Route path="stock-receipts/create" element={<StockReceiptCreate />} />

        {/* Catch all - redirect to dashboard */}
        <Route path="*" element={<Navigate to="/staff-dashboard" replace />} />
      </Routes>
    </StaffLayout>
  );
};

export default StaffDashboard;
