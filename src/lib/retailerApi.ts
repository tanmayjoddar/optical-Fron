import axios, { AxiosHeaders, type AxiosRequestHeaders } from "axios";

// Base axios instance for Retailer Portal API
export const retailerApi = axios.create({
  baseURL: "https://staff-production-c6d9.up.railway.app/retailer",
  headers: { "Content-Type": "application/json" },
});

// Attach JWT token from localStorage on each request
retailerApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("jwt");
  if (token) {
    const value = `Bearer ${token}`;
    if (config.headers instanceof AxiosHeaders) {
      config.headers.set("Authorization", value);
    } else {
      const plain = { ...(config.headers as Record<string, unknown>), Authorization: value };
      config.headers = plain as unknown as AxiosRequestHeaders;
    }
  }
  return config;
});

// Optional: basic error normalization
retailerApi.interceptors.response.use(
  (res) => res,
  (error) => {
    const message =
      error?.response?.data?.error || error?.response?.data?.message || error.message || "Request failed";
    return Promise.reject(new Error(message));
  }
);

// Lightweight helpers
export const RetailerAPI = {
  // Dashboard
  overview: () => retailerApi.get("/dashboard/overview").then((r) => r.data),
  salesAnalytics: (params: { period?: string; startDate?: string; endDate?: string } = {}) =>
    retailerApi.get("/dashboard/sales-analytics", { params }).then((r) => r.data),
  inventoryAnalytics: () => retailerApi.get("/dashboard/inventory-analytics").then((r) => r.data),
  shopPerformance: (params: { period?: string; shopId?: number } = {}) =>
    retailerApi.get("/dashboard/shop-performance", { params }).then((r) => r.data),

  // Inventory
  inventorySummary: () => retailerApi.get("/inventory/summary").then((r) => r.data),
  companies: () => retailerApi.get("/inventory/companies").then((r) => r.data),
  addCompany: (body: { name: string; description?: string }) =>
    retailerApi.post("/inventory/companies", body).then((r) => r.data),
  updateCompany: (companyId: number, body: { name?: string; description?: string }) =>
    retailerApi.put(`/inventory/companies/${companyId}`, body).then((r) => r.data),
  productsByCompany: (
    companyId: number,
    params: { eyewearType?: 'GLASSES' | 'SUNGLASSES' | 'LENSES'; page?: number; limit?: number } = {}
  ) => retailerApi.get(`/inventory/companies/${companyId}/products`, { params }).then((r) => r.data),
  addProduct: (body: {
    name: string;
    description?: string;
    basePrice: number;
    barcode?: string;
    sku?: string;
    eyewearType: 'GLASSES' | 'SUNGLASSES' | 'LENSES';
    frameType?: string;
    companyId: number;
    material?: string;
    color?: string;
    size?: string;
    model?: string;
  }) => retailerApi.post("/inventory/products", body).then((r) => r.data),
  updateProduct: (productId: number, body: Record<string, unknown>) =>
    retailerApi.put(`/inventory/products/${productId}`, body).then((r) => r.data),
  retailerProducts: (params: Record<string, unknown> = {}) => retailerApi.get("/inventory/my-products", { params }).then((r) => r.data),
  addRetailerProduct: (body: {
    productId: number;
    wholesalePrice: number;
    mrp: number;
    minSellingPrice?: number;
    initialStock?: number;
    reorderLevel?: number;
    warehouseLocation?: string;
    supplier?: string;
    costPrice?: number;
  }) => retailerApi.post('/inventory/my-products', body).then((r) => r.data),
  updateStock: (retailerProductId: number, body: {
    quantity: number;
    type: 'ADD' | 'REMOVE';
    reason?: string;
    costPrice?: number;
    supplier?: string;
    warehouseLocation?: string;
    batchNumber?: string;
    expiryDate?: string;
  }) => retailerApi.put(`/inventory/my-products/${retailerProductId}/stock`, body).then((r) => r.data),
  updateRetailerProduct: (retailerProductId: number, body: Record<string, unknown>) =>
    retailerApi.put(`/inventory/my-products/${retailerProductId}`, body).then((r) => r.data),

  // Shops & Distributions
  shops: (params: Record<string, unknown> = {}) => retailerApi.get("/shops", { params }).then((r) => r.data),
  addShop: (body: { shopId: number; partnershipType: 'FRANCHISE' | 'DEALER' | 'DISTRIBUTOR'; commissionRate?: number; creditLimit?: number; paymentTerms?: string }) =>
    retailerApi.post('/shops', body).then((r) => r.data),
  updateShopPartnership: (retailerShopId: number, body: { commissionRate?: number; creditLimit?: number; paymentTerms?: string; isActive?: boolean }) =>
    retailerApi.put(`/shops/${retailerShopId}`, body).then((r) => r.data),
  distributions: (params: Record<string, unknown> = {}) => retailerApi.get("/distributions", { params }).then((r) => r.data),
  shopDistributions: (retailerShopId: number, params: Record<string, unknown> = {}) =>
    retailerApi.get(`/shops/${retailerShopId}/distributions`, { params }).then((r) => r.data),
  distributeToShop: (body: {
    retailerShopId: number;
    distributions: { retailerProductId: number; quantity: number; unitPrice: number }[];
    notes?: string;
    paymentDueDate?: string;
  }) => retailerApi.post('/distributions', body).then((r) => r.data),
  updateDeliveryStatus: (distributionId: number, body: { deliveryStatus: string; deliveryDate?: string; trackingNumber?: string }) =>
    retailerApi.put(`/distributions/${distributionId}/delivery-status`, body).then((r) => r.data),
  updatePaymentStatus: (distributionId: number, body: { paymentStatus: string; paidDate?: string }) =>
    retailerApi.put(`/distributions/${distributionId}/payment-status`, body).then((r) => r.data),

  // Reports
  reports: (params: Record<string, unknown> = {}) => retailerApi.get("/reports", { params }).then((r) => r.data),
  profitLoss: (params: { startDate: string; endDate: string; format?: 'json' | 'pdf' }) =>
    retailerApi.get("/reports/profit-loss", { params }).then((r) => r.data),
  taxReport: (params: { startDate: string; endDate: string; format?: 'json' | 'pdf' }) =>
    retailerApi.get("/reports/tax-report", { params }).then((r) => r.data),
  stockValuation: () => retailerApi.get("/reports/stock-valuation").then((r) => r.data),
  deleteReport: (reportId: number) => retailerApi.delete(`/reports/${reportId}`).then((r) => r.data),

  // Auth/Profile
  getProfile: () => retailerApi.get('/auth/profile').then((r) => r.data),
  updateProfile: (body: { name?: string; companyName?: string; phone?: string; address?: string; gstNo?: string; licenseNo?: string }) =>
    retailerApi.put('/auth/profile', body).then((r) => r.data),
  changePassword: (body: { currentPassword: string; newPassword: string }) =>
    retailerApi.put('/auth/change-password', body).then((r) => r.data),
  refreshToken: () => retailerApi.post('/auth/refresh-token').then((r) => r.data),

  // Retailer inventory products
  myProducts: (params: {
    companyId?: number;
    eyewearType?: 'GLASSES' | 'SUNGLASSES' | 'LENSES';
    lowStock?: boolean;
    outOfStock?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  } = {}) => retailerApi.get("/inventory/my-products", { params }).then((r) => r.data),
};

export type ApiError = Error & { status?: number };
