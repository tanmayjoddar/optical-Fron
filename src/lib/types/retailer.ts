// Auto-generated initial Retailer API Type Definitions based on backend docs (endpoints 3-31)
// NOTE: Refine as backend evolves. Optional fields marked with ? when not always present in examples.

// =============== AUTH / PROFILE (Endpoints 3-6 already largely implemented) ===============
export interface RetailerProfile {
  id: number;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  businessType?: string; // WHOLESALE | etc.
  createdAt?: string;
  updatedAt?: string;
}
export interface RetailerProfileResponse {
  retailer: RetailerProfile;
}
export interface RetailerProfileUpdateRequest {
  name?: string;
  phone?: string;
  address?: string;
}
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}
export interface ChangePasswordResponse {
  message: string;
}

// =============== DASHBOARD (Endpoints 7-10) ===============
export interface DashboardOverviewResponse {
  salesSummary: {
    today: { totalSales: number; orderCount: number };
    thisMonth: { totalSales: number; orderCount: number };
  };
  inventoryStatus: {
    totalProducts: number;
    totalStock: number;
    availableStock: number;
    allocatedStock: number;
    lowStockProducts: number;
    outOfStockProducts: number;
  };
  monthlyOverview: {
    productsSold: number;
    revenueGenerated: number;
    distributionCount: number;
    activeShops: number;
  };
  topProducts: Array<{
    product?: { name?: string; company?: { name?: string } };
    soldQuantity?: number;
    revenue?: number;
  }>;
}

export interface SalesAnalyticsParams {
  period?: "week" | "month" | "quarter" | "year";
}
export interface SalesAnalyticsResponse {
  period: string;
  salesData: {
    totalRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
    growthRate: number;
  };
  chartData: Array<unknown>; // refine when backend chart points defined
  topSellingProducts: Array<unknown>;
}

export interface InventoryAnalyticsResponse {
  inventoryMetrics: {
    totalValue: number;
    turnoverRate: number;
    lowStockCount: number;
    outOfStockCount: number;
  };
  categoryBreakdown: Array<{
    category: string;
    productCount: number;
    totalStock: number;
    value: number;
  }>;
}

export interface ShopPerformanceParams {
  period?: "week" | "month" | "quarter";
}
export interface ShopPerformanceResponse {
  period: string;
  shopPerformance: Array<{
    shopId: number;
    shopName: string;
    totalDistributions: number;
    totalAmount: number;
    paymentStatus: string;
  }>;
}

// =============== REPORTS (Endpoints 11-15) ===============
export interface ReportsListParams {
  page?: number;
  limit?: number;
}
export interface ReportsListResponse {
  reports: Array<ReportRecord>;
  pagination: { page: number; limit: number; total: number; pages: number };
}
export interface ReportRecord {
  id: number;
  type: string;
  generatedAt: string;
  summary?: Record<string, unknown>;
}

export interface ProfitLossParams {
  startDate?: string;
  endDate?: string;
}
export interface ProfitLossResponse {
  reportType: "profit-loss";
  generatedAt: string;
  period: { startDate: string; endDate: string };
  summary: {
    totalRevenue: number;
    totalCosts: number;
    grossProfit: number;
    netProfit: number;
  };
  details: Array<unknown>;
}

export interface TaxReportParams {
  startDate?: string;
  endDate?: string;
}
export interface TaxReportResponse {
  reportType: "tax-report";
  generatedAt: string;
  taxSummary: {
    totalTaxableAmount: number;
    totalTaxAmount: number;
    gstBreakdown: Array<unknown>;
  };
}

export interface StockValuationResponse {
  generatedAt: string;
  valuationMethod: string;
  summary: {
    totalProducts: number;
    totalStockValue: number;
    totalPotentialRevenue: number;
    totalExpectedProfit: number;
  };
  stockValuation: Array<{
    product: { id: number; name: string };
    inventory: { totalStock: number; availableStock: number };
    valuation: { unitCost: number; totalValue: number; sellingPrice: number };
  }>;
  companyBreakdown: Array<{
    company: string;
    productCount: number;
    totalStock: number;
    totalValue: number;
    totalPotentialRevenue: number;
    averageValue: number;
  }>;
  typeBreakdown: Array<{
    eyewearType: string;
    productCount: number;
    totalStock: number;
    totalValue: number;
    totalPotentialRevenue: number;
    averageValue: number;
  }>;
}

export interface DeleteReportResponse {
  message: string;
}

// =============== INVENTORY MANAGEMENT (Endpoints 16-25) ===============
export interface CompanyRecord {
  id: number;
  name: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
  _count?: { products?: number };
}
export type CompaniesResponse = CompanyRecord[];
export interface AddCompanyRequest {
  name: string;
  description?: string;
}
export interface AddCompanyResponse {
  message: string;
  company: CompanyRecord;
}

export interface ProductRecord {
  id: number;
  name: string;
  description?: string;
  basePrice: number;
  barcode?: string;
  sku?: string;
  eyewearType: string;
  frameType?: string;
  companyId: number;
  material?: string;
  color?: string;
  size?: string;
  model?: string;
  company?: { id: number; name: string; description?: string };
  _count?: { retailerProducts?: number };
}
export interface ProductsByCompanyResponse {
  products: ProductRecord[];
}

export interface AddProductRequest {
  name: string;
  description?: string;
  companyId: number;
  eyewearType: "SUNGLASSES" | "GLASSES" | "LENSES";
  frameType?: string;
  material?: string;
  basePrice: number;
  sku: string;
  barcode: string;
}
export interface AddProductResponse {
  message: string;
  product: ProductRecord;
}
export interface UpdateProductRequest {
  name?: string;
  description?: string;
  basePrice?: number;
}
export interface UpdateProductResponse {
  message: string;
  product: Partial<ProductRecord> & { id: number };
}

export interface RetailerProductRecord {
  id: number;
  retailerId?: number;
  productId: number;
  wholesalePrice: number;
  retailPrice?: number;
  totalStock?: number;
  allocatedStock?: number;
  availableStock?: number;
  isActive?: boolean;
  product?: {
    id: number;
    name: string;
    eyewearType?: string;
    company?: { name?: string };
  };
  stockStatus?: string;
  stockValue?: number;
}
export interface RetailerProductsListResponse {
  products: RetailerProductRecord[];
  pagination: { page: number; limit: number; total: number; pages: number };
}
export interface AddRetailerProductRequest {
  productId: number;
  wholesalePrice: number;
  retailPrice: number;
}
export interface AddRetailerProductResponse {
  message: string;
  retailerProduct: RetailerProductRecord;
}
export interface UpdateRetailerProductRequest {
  wholesalePrice?: number;
  retailPrice?: number;
  isActive?: boolean;
}
export interface UpdateRetailerProductResponse {
  message: string;
  retailerProduct: Partial<RetailerProductRecord> & { id: number };
}

export interface UpdateStockRequest {
  quantity: number;
  type: "ADD" | "REMOVE";
  reason?: string;
  costPrice?: number;
  supplier?: string;
}
export interface UpdateStockResponse {
  message: string;
  retailerProduct: {
    id: number;
    totalStock?: number;
    availableStock?: number;
    updatedAt?: string;
  };
}

export interface InventorySummaryResponse {
  totalProducts: number;
  totalStockValue: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  categories: Record<string, { count: number; value: number }>;
}

// When backend supplies additional real-time stock fields beyond documented baseline
// (e.g., availableStock, allocatedStock, totalStock), we separate the strict doc baseline
// (InventorySummaryResponse) from an extended shape the UI may opportunistically use.
export interface InventorySummaryExtended extends InventorySummaryResponse {
  // Optional extended aggregate metrics (not guaranteed by spec but observed in responses)
  availableStock?: number;
  allocatedStock?: number;
  totalStock?: number;
}

// =============== SHOP DISTRIBUTION (Endpoints 26-31) ===============
export interface RetailerShopRecord {
  id: number;
  retailerId?: number;
  shopId: number;
  partnershipType: string;
  commissionRate?: number;
  creditLimit?: number;
  paymentTerms?: string;
  isActive?: boolean;
  shop?: {
    id: number;
    name: string;
    address?: string;
    phone?: string;
    email?: string;
  };
  stats?: {
    totalDistributions?: number;
    totalQuantityDistributed?: number;
    totalAmountDistributed?: number;
    pendingPayments?: number;
  };
}
export type RetailerShopsResponse = RetailerShopRecord[];
export interface AddShopRequest {
  shopId: number;
  partnershipType: "FRANCHISE" | "DEALER" | "DISTRIBUTOR";
  commissionRate?: number;
  creditLimit?: number;
  paymentTerms?: string;
}
export interface AddShopResponse {
  message: string;
  retailerShop: RetailerShopRecord;
}
export interface UpdateShopRelationshipRequest {
  partnershipType?: string;
  commissionRate?: number;
  creditLimit?: number;
  isActive?: boolean;
}
export interface UpdateShopRelationshipResponse {
  message: string;
  retailerShop: Partial<RetailerShopRecord> & { id: number };
}

export interface DistributionLine {
  id: number;
  retailerId?: number;
  retailerShopId: number;
  retailerProductId: number;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  deliveryStatus: string;
  paymentStatus: string;
  notes?: string;
  paymentDueDate?: string;
  retailerProduct?: { product?: { name?: string } };
  retailerShop?: { shop?: { name?: string } };
}
export interface CreateDistributionRequest {
  retailerShopId: number;
  distributions: {
    retailerProductId: number;
    quantity: number;
    unitPrice: number;
  }[];
  notes?: string;
  paymentDueDate?: string;
}
export interface CreateDistributionResponse {
  message: string;
  distributions: DistributionLine[];
}
export interface DistributionsListResponse {
  distributions: DistributionLine[];
  pagination: { page: number; limit: number; total: number; pages: number };
}
export interface ShopDistributionsResponse {
  shop: { id: number; name: string };
  distributions: DistributionLine[];
  summary: {
    totalDistributions: number;
    totalAmount: number;
    pendingDeliveries: number;
    pendingPayments: number;
  };
}

// =============== ENHANCED SHOP DISCOVERY (Endpoints 32-33) ===============
export interface AvailableShop {
  id: number;
  name: string;
  address: string;
  phone: string;
  email: string;
  createdAt: string;
}
export interface AvailableShopsResponse {
  availableShops: AvailableShop[];
  total: number;
  message: string;
}
export interface ShopNetworkStat {
  totalDistributions: number;
  totalQuantityDistributed: number;
  totalAmountDistributed: number;
  pendingDeliveries: number;
  pendingAmount: number;
  lastDistribution?: {
    date: string;
    product: string;
    quantity: number;
    amount: number;
    status: string;
  };
}
export interface MyShopNetworkRecord {
  id: number;
  shop: {
    id: number;
    name: string;
    address: string;
    phone: string;
    email: string;
    createdAt: string;
  };
  partnershipType: string;
  joinedAt: string;
  isActive: boolean;
  stats: ShopNetworkStat;
}
export interface MyShopNetworkResponse {
  myShops: MyShopNetworkRecord[];
  totalShops: number;
  message: string;
}

// Param helpers (typed query objects) -------------------------------------------------
// Query /distributions supports filtering by `shopId` per docs (endpoint 30). Some legacy code may still use `retailerShopId`.
// Both are kept optional; avoid sending both unless necessary.
export interface DistributionsListParams {
  page?: number;
  limit?: number;
  status?: string;
  startDate?: string; // (extension: not in docs but retained if backend supports date range later)
  endDate?: string; // (extension)
  shopId?: number; // documented filter param
  retailerShopId?: number; // legacy/internal (prefer shopId for spec alignment)
}
export interface ShopDistributionsParams {
  page?: number;
  limit?: number;
  status?: string;
  startDate?: string; // extension
  endDate?: string; // extension
}
// Docs use `isActive` & `partnershipType` as filters for /shops (endpoint 26). Renamed `active` -> `isActive` and added `partnershipType`.
export interface RetailerShopsParams {
  page?: number;
  limit?: number;
  search?: string; // UI convenience (not in docs)
  isActive?: boolean; // spec-aligned filter
  partnershipType?: "FRANCHISE" | "DEALER" | "DISTRIBUTOR"; // spec-aligned filter
  // active?: boolean; // deprecated; migrate to isActive
}

// NOTE: Delivery/payment status update endpoints removed (not in the 31 documented endpoints).

// Generic success/error fallback
export interface BasicMessageResponse {
  message: string;
}
