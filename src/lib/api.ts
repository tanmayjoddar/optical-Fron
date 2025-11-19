import axios, {
  AxiosHeaders,
  type AxiosRequestHeaders,
  type AxiosResponse,
} from "axios";
import { store } from "../store";
import { logout, logoutWithAttendance } from "../store/authSlice";
// Doctor domain types
import type {
  PatientsResponse,
  PrescriptionCreatePayload,
  PrescriptionCreateResponse,
  PrescriptionsListResponse,
  PrescriptionDetailResponse,
} from "./types/doctor";
// Retailer domain types (endpoints 3-31)
import type {
  DashboardOverviewResponse,
  SalesAnalyticsParams,
  SalesAnalyticsResponse,
  InventoryAnalyticsResponse,
  ShopPerformanceParams,
  ShopPerformanceResponse,
  ReportsListResponse,
  ProfitLossParams,
  ProfitLossResponse,
  TaxReportParams,
  TaxReportResponse,
  StockValuationResponse,
  DeleteReportResponse,
  InventorySummaryResponse,
  CompaniesResponse,
  AddCompanyRequest,
  AddCompanyResponse,
  ProductsByCompanyResponse,
  AddProductRequest,
  AddProductResponse,
  UpdateProductRequest,
  UpdateProductResponse,
  RetailerProductsListResponse,
  RetailerProductRecord,
  AddRetailerProductRequest,
  AddRetailerProductResponse,
  UpdateRetailerProductRequest,
  UpdateRetailerProductResponse,
  UpdateStockRequest,
  UpdateStockResponse,
  RetailerShopsResponse,
  AddShopRequest,
  AddShopResponse,
  UpdateShopRelationshipRequest,
  UpdateShopRelationshipResponse,
  DistributionsListResponse,
  CreateDistributionRequest,
  CreateDistributionResponse,
  ShopDistributionsResponse,
  DistributionsListParams,
  ShopDistributionsParams,
  RetailerShopsParams,
  AvailableShopsResponse,
  MyShopNetworkResponse,
} from "./types/retailer";

// Shop Admin domain types - imported inline in API methods

// ============================================================================
// BASE AXIOS CONFIGURATION
// ============================================================================

export const BASE_URL = "https://staff-optical-1.onrender.com";

// Utility function for consistent API logging
const logApiCall = (
  method: string,
  url: string,
  data?: unknown,
  response?: unknown
) => {
  console.log(`🔄 API ${method.toUpperCase()}: ${url}`, {
    request: data && Object.keys(data).length > 0 ? data : "No data",
    response: response ? "Response received" : "No response yet",
    timestamp: new Date().toISOString(),
  });
};

// Create main axios instance
const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Create staff-specific axios instance
const staffApi = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// Create retailer-specific axios instance
const retailerApi = axios.create({
  baseURL: `${BASE_URL}/retailer`,
  headers: { "Content-Type": "application/json" },
});

// Create doctor-specific axios instance
const doctorApi = axios.create({
  baseURL: `${BASE_URL}/doctor`,
  headers: { "Content-Type": "application/json" },
});

// ============================================================================
// REQUEST INTERCEPTORS - Add JWT tokens and logging
// ============================================================================

// Main API Client interceptor
apiClient.interceptors.request.use(
  (config) => {
    const state = store.getState();
    const token = state.auth.token;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    logApiCall(config.method || "GET", config.url || "", config.data);
    return config;
  },
  (error) => {
    console.error("❌ API Request Error:", error);
    return Promise.reject(error);
  }
);

// Staff API interceptor
staffApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("jwt");
  if (token) {
    const value = `Bearer ${token}`;
    if (config.headers instanceof AxiosHeaders) {
      config.headers.set("Authorization", value);
    } else {
      const plain = {
        ...(config.headers as Record<string, unknown>),
        Authorization: value,
      };
      config.headers = plain as unknown as AxiosRequestHeaders;
    }
  }

  logApiCall(config.method || "GET", config.url || "", config.data);
  return config;
});

// Retailer API interceptor
retailerApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("jwt");
  if (token) {
    const value = `Bearer ${token}`;
    if (config.headers instanceof AxiosHeaders) {
      config.headers.set("Authorization", value);
    } else {
      const plain = {
        ...(config.headers as Record<string, unknown>),
        Authorization: value,
      };
      config.headers = plain as unknown as AxiosRequestHeaders;
    }
  }

  logApiCall(config.method || "GET", config.url || "", config.data);
  return config;
});

// Doctor API interceptor
doctorApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("jwt");
  if (token) {
    const value = `Bearer ${token}`;
    if (config.headers instanceof AxiosHeaders) {
      config.headers.set("Authorization", value);
    } else {
      const plain = {
        ...(config.headers as Record<string, unknown>),
        Authorization: value,
      };
      config.headers = plain as unknown as AxiosRequestHeaders;
    }
  }
  logApiCall(config.method || "GET", config.url || "", config.data);
  return config;
});

// ============================================================================
// RESPONSE INTERCEPTORS - Handle errors and logging
// ============================================================================

// Main API Client response interceptor
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log("✅ API Response:", response.config.url, {
      status: response.status,
      data: response.data,
      timestamp: new Date().toISOString(),
    });
    return response;
  },
  (error) => {
    console.error("❌ API Error:", error.config?.url, {
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      timestamp: new Date().toISOString(),
    });

    if (error.response?.status === 401) {
      const state = store.getState();
      const userType = state.auth.type;

      // Use enhanced logout for staff, regular logout for others
      if (userType === "staff") {
        store.dispatch(logoutWithAttendance());
      } else {
        store.dispatch(logout());
      }

      // Role-aware redirect
      if (userType === "shopAdmin") {
        window.location.href = "/shop-admin-login";
      } else if (userType === "retailer") {
        window.location.href = "/retailer-login";
      } else if (userType === "doctor") {
        window.location.href = "/doctor-login";
      } else {
        window.location.href = "/staff-login";
      }
    }

    return Promise.reject(error);
  }
);

// Staff API response interceptor
staffApi.interceptors.response.use(
  (res: AxiosResponse) => {
    console.log("✅ Staff API Response:", res.config.url, {
      status: res.status,
      data: res.data,
      timestamp: new Date().toISOString(),
    });
    return res;
  },
  (error) => {
    console.error("❌ Staff API Error:", error.config?.url, {
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      timestamp: new Date().toISOString(),
    });

    const message =
      error?.response?.data?.error ||
      error?.response?.data?.message ||
      error.message ||
      "Request failed";
    return Promise.reject(new Error(message));
  }
);

// Retailer API response interceptor
retailerApi.interceptors.response.use(
  (res: AxiosResponse) => {
    console.log("✅ Retailer API Response:", res.config.url, {
      status: res.status,
      data: res.data,
      timestamp: new Date().toISOString(),
    });
    return res;
  },
  (error) => {
    console.error("❌ Retailer API Error:", error.config?.url, {
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      timestamp: new Date().toISOString(),
    });

    const message =
      error?.response?.data?.error ||
      error?.response?.data?.message ||
      error.message ||
      "Request failed";
    return Promise.reject(new Error(message));
  }
);

// Doctor API response interceptor
doctorApi.interceptors.response.use(
  (res: AxiosResponse) => {
    console.log("✅ Doctor API Response:", res.config.url, {
      status: res.status,
      data: res.data,
      timestamp: new Date().toISOString(),
    });
    return res;
  },
  (error) => {
    console.error("❌ Doctor API Error:", error.config?.url, {
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      timestamp: new Date().toISOString(),
    });
    const message =
      error?.response?.data?.error ||
      error?.response?.data?.message ||
      error.message ||
      "Request failed";
    return Promise.reject(new Error(message));
  }
);

// ============================================================================
// UNIFIED API EXPORTS - All APIs consolidated with consistent structure
// ============================================================================

// ============================================================================
// STAFF API ENDPOINTS
// ============================================================================
export const StaffAPI = {
  // Attendance Management
  attendance: {
    logout: () => staffApi.post("/api/attendance/logout").then((r) => r.data),
    getByStaff: (staffId: number) =>
      staffApi.get(`/api/attendance/${staffId}`).then((r) => r.data),
  },

  // Auth Management
  auth: {
    login: (data: { email: string; password: string }) =>
      staffApi.post("/api/auth/login", data).then((r) => r.data),
    logout: () => staffApi.post("/api/auth/logout").then((r) => r.data),
  },

  // Barcode Management
  barcode: {
    // Generate a barcode label image (PNG/SVG). API returns binary image data.
    generateLabel: (data: {
      productId?: number;
      format?: string;
      width?: number;
      height?: number;
    }) =>
      staffApi
        .post("/api/barcode/label", data, { responseType: "blob" })
        .then((r) => r.data as Blob),
    generate: (productId: number) =>
      staffApi.post(`/api/barcode/generate/${productId}`).then((r) => r.data),
    generateSku: (productId: number) =>
      staffApi
        .post(`/api/barcode/sku/generate/${productId}`)
        .then((r) => r.data),
    getMissing: () => staffApi.get("/api/barcode/missing").then((r) => r.data),
    generateLegacy: (data: {
      productId?: number;
      format?: string;
      width?: number;
      height?: number;
    }) => staffApi.post("/api/barcode/", data).then((r) => r.data), // Legacy route
  },

  // Patient Management
  patients: {
    getAll: (params: { page?: number; limit?: number; search?: string } = {}) =>
      staffApi.get("/api/patient", { params }).then((r) => r.data),
    getById: (id: number) =>
      staffApi.get(`/api/patient/${id}`).then((r) => r.data),
    create: (data: {
      name: string;
      age?: number;
      gender?: string;
      phone?: string;
      address?: string;
      medicalHistory?: string;
    }) => staffApi.post("/api/patient", data).then((r) => r.data),
    update: (
      id: number,
      data: {
        name?: string;
        age?: number;
        gender?: string;
        phone?: string;
        address?: string;
        medicalHistory?: string;
      },
      shopId?: number
    ) => {
      const params = shopId ? { shopId } : {};
      return apiClient.put(`/api/patient/${id}`, data, { params });
    },
    delete: (id: number, shopId?: number) => {
      const params = shopId ? { shopId } : {};
      return apiClient.delete(`/api/patient/${id}`, { params });
    },
  },

  // Customer Management
  customers: {
    getAll: (params?: { page?: number; limit?: number; search?: string }) =>
      staffApi.get("/api/customer", { params }).then((r) => r.data),
    getById: (id: number) =>
      staffApi.get(`/api/customer/${id}`).then((r) => r.data),
    getHotspots: () =>
      staffApi.get("/api/customer/hotspots").then((r) => r.data),
    create: (data: { name: string; phone: string; address: string }) =>
      staffApi.post("/api/customer", data).then((r) => r.data),
    createWithInvoice: (data: {
      customer: {
        name: string;
        phone: string;
        address: string;
      };
      items: Array<{
        productId: number;
        quantity: number;
        unitPrice: number;
      }>;
      paidAmount: number;
      paymentMethod: string;
    }) => staffApi.post("/api/customer/invoice", data).then((r) => r.data),
  },

  // Inventory & Barcode Management
  inventory: {
    // Current inventory with stock levels
    getAll: () => staffApi.get("/api/inventory/").then((r) => r.data),

    // Products management
    getProducts: (params?: {
      page?: number;
      limit?: number;
      search?: string;
      eyewearType?: string;
      companyId?: number;
      frameType?: string;
    }) =>
      staffApi.get("/api/inventory/products", { params }).then((r) => r.data),
    getProductById: (productId: number) =>
      staffApi.get(`/api/inventory/product/${productId}`).then((r) => r.data),
    getProductByBarcode: (barcode: string) =>
      staffApi
        .get(`/api/inventory/product/barcode/${encodeURIComponent(barcode)}`)
        .then((r) => r.data),
    addProduct: (data: {
      name: string;
      description?: string;
      basePrice: number;
      eyewearType: string;
      companyId: number;
      barcode?: string;
      sku?: string;
      frameType?: string;
      material?: string;
      color?: string;
      size?: string;
      model?: string;
    }) => staffApi.post("/api/inventory/product", data).then((r) => r.data),
    updateProduct: (
      productId: number,
      data: {
        name?: string;
        description?: string;
        basePrice?: number;
        eyewearType?: string;
        companyId?: number;
        barcode?: string;
        sku?: string;
        frameType?: string;
        material?: string;
        color?: string;
        size?: string;
        model?: string;
      }
    ) =>
      staffApi
        .put(`/api/inventory/product/${productId}`, data)
        .then((r) => r.data),

    // Stock operations
    stockByBarcode: (data: {
      barcode: string;
      quantity: number;
      action: string;
    }) =>
      staffApi
        .post("/api/inventory/stock-by-barcode", data)
        .then((r) => r.data),
    stockOutByBarcode: (data: { barcode: string; quantity: number }) =>
      staffApi
        .post("/api/inventory/stock-out-by-barcode", data)
        .then((r) => r.data),
    stockIn: (data: {
      productId?: number;
      barcode?: string;
      quantity: number;
      costPrice?: number;
      sellingPrice?: number;
    }) => staffApi.post("/api/inventory/stock-in", data).then((r) => r.data),
    stockOut: (data: {
      productId?: number;
      barcode?: string;
      quantity: number;
    }) => staffApi.post("/api/inventory/stock-out", data).then((r) => r.data),

    // Company management
    addCompany: (data: { name: string; description?: string }) =>
      staffApi.post("/api/inventory/company", data).then((r) => r.data),
    getCompanies: () =>
      staffApi.get("/api/inventory/companies").then((r) => r.data),
    getCompanyProducts: (
      companyId: number,
      params?: {
        eyewearType?: string;
        frameType?: string;
      }
    ) =>
      staffApi
        .get(`/api/inventory/company/${companyId}/products`, { params })
        .then((r) => r.data),
  },

  // Invoice Management
  payment: {
    processPayment: (data: {
      invoiceId: number | string;
      amount: number;
      paymentMethod: string;
      giftCardCode?: string;
    }) => staffApi.post("/api/payment", data).then((r) => r.data),
  },

  invoices: {
    getAll: (params?: {
      page?: number;
      limit?: number;
      status?: string;
      patientId?: number;
      customerId?: number;
      startDate?: string;
      endDate?: string;
    }) => staffApi.get("/api/invoice/", { params }).then((r) => r.data),
    getById: (id: string) =>
      staffApi.get(`/api/invoice/${id}`).then((r) => r.data),
    create: (data: {
      patientId?: number;
      customerId?: number;
      prescriptionId?: number;
      items: Array<{
        productId: number;
        quantity: number;
        discount?: number; // absolute amount
        cgst?: number; // absolute amount
        sgst?: number; // absolute amount
      }>;
      paidAmount?: number;
      paymentMethod?: string;
      notes?: string;
    }) => staffApi.post("/api/invoice/", data).then((r) => r.data),
    updateStatus: (id: string, data: { status: string; reason?: string }) =>
      staffApi.patch(`/api/invoice/${id}/status`, data).then((r) => r.data),
    addPayment: (
      id: string,
      data: {
        amount: number;
        method: string;
        notes?: string;
        giftCardId?: number;
      }
    ) => staffApi.post(`/api/invoice/${id}/payment`, data).then((r) => r.data),
    delete: (id: string) =>
      staffApi.delete(`/api/invoice/${id}`).then((r) => r.data),
    getPdf: (id: string) =>
      staffApi
        .get(`/api/invoice/${id}/pdf`, { responseType: "blob" })
        .then((r) => r.data as Blob),
    getThermal: (id: string) =>
      staffApi
        .get(`/api/invoice/${id}/thermal`, { responseType: "text" })
        .then((r) => r.data as string),
  },

  // Prescription Management
  prescriptions: {
    // List prescriptions with pagination and filtering
    getAll: (
      params: { page?: number; limit?: number; patientId?: number } = {}
    ) => staffApi.get("/api/prescription", { params }).then((r) => r.data),
    // Get single prescription by ID
    getById: (id: number) =>
      staffApi.get(`/api/prescription/${id}`).then((r) => r.data),
    // Create new prescription
    create: (data: {
      patientId: number;
      rightEye?: {
        type?: string;
        sph?: string;
        cyl?: string;
        axis?: string;
        add?: string;
        pd?: string;
        bc?: string;
        remarks?: string;
      };
      leftEye?: {
        type?: string;
        sph?: string;
        cyl?: string;
        axis?: string;
        add?: string;
        pd?: string;
        bc?: string;
        remarks?: string;
      };
      notes?: string;
    }) => staffApi.post("/api/prescription", data).then((r) => r.data),
    // Download prescription as PDF
    getPdf: (id: number) =>
      staffApi
        .get(`/api/prescription/${id}/pdf`, { responseType: "blob" })
        .then((r) => r.data as Blob),
    // Get thermal print data
    getThermal: (id: number) =>
      staffApi
        .get(`/api/prescription/${id}/thermal`, { responseType: "json" })
        .then((r) => r.data as { thermalContent: string }),
  },

  // Reports
  reports: {
    dailyReport: (date: string) =>
      staffApi
        .get("/api/reports/daily", { params: { date } })
        .then((r) => r.data),
    monthlyReport: (year: number, month: number) =>
      staffApi
        .get("/api/reports/monthly", { params: { year, month } })
        .then((r) => r.data),
    staffSalesReport: (startDate: string, endDate: string) =>
      staffApi
        .get("/api/reports/staff-sales", { params: { startDate, endDate } })
        .then((r) => r.data),
    salesByPriceTier: (startDate: string, endDate: string) =>
      staffApi
        .get("/api/reports/sales-by-price-tier", {
          params: { startDate, endDate },
        })
        .then((r) => r.data),
    bestSellersByPriceTier: (
      startDate: string,
      endDate: string,
      limit?: number
    ) =>
      staffApi
        .get("/api/reports/best-sellers-by-price-tier", {
          params: { startDate, endDate, limit },
        })
        .then((r) => r.data),
  },

  // Royalty System
  royalty: {
    addRoyaltyPoints: (patientId: number) =>
      staffApi.post("/api/royalty", { patientId }).then((r) => r.data),
    getRoyaltyPoints: (patientId: number) =>
      staffApi.get(`/api/royalty/${patientId}`).then((r) => r.data),
  },

  // Stock Receipts
  stockReceipts: {
    create: (data: {
      productId: number;
      receivedQuantity: number;
      supplierName?: string;
      deliveryNote?: string;
      batchNumber?: string;
      expiryDate?: string;
    }) => staffApi.post("/api/stock-receipts", data).then((r) => r.data),
    getAll: (params: { status?: string } = {}) =>
      staffApi.get("/api/stock-receipts", { params }).then((r) => r.data),
    getById: (id: number) =>
      staffApi.get(`/api/stock-receipts/${id}`).then((r) => r.data),
  },

  // Gift Cards
  giftCards: {
    issue: (data: { patientId: number; balance: number }) =>
      staffApi.post("/api/gift-card/issue", data).then((r) => r.data),
    redeem: (data: { code: string; amount: number }) =>
      staffApi.post("/api/gift-card/redeem", data).then((r) => r.data),
    getBalance: (code: string) =>
      staffApi.get(`/api/gift-card/${code}`).then((r) => r.data),
  },
};

// ============================================================================
// RETAILER API ENDPOINTS
// ============================================================================
export const RetailerAPI = {
  // Authentication
  auth: {
    register: (data: {
      name: string;
      email: string;
      password: string;
      phone?: string;
      address?: string;
      businessType?: string;
    }) => retailerApi.post("/auth/register", data).then((r) => r.data),
    login: (data: { email: string; password: string }) =>
      retailerApi.post("/auth/login", data).then((r) => r.data),
    logout: () => retailerApi.post("/auth/logout").then((r) => r.data),
    changePassword: (data: { currentPassword: string; newPassword: string }) =>
      retailerApi.put("/auth/change-password", data).then((r) => r.data),
  },
  // Dashboard Analytics
  dashboard: {
    overview: (): Promise<DashboardOverviewResponse> =>
      retailerApi
        .get("/dashboard/overview")
        .then((r) => r.data as DashboardOverviewResponse),
    salesAnalytics: (
      params: SalesAnalyticsParams = {}
    ): Promise<SalesAnalyticsResponse> =>
      retailerApi
        .get("/dashboard/sales-analytics", { params })
        .then((r) => r.data as SalesAnalyticsResponse),
    inventoryAnalytics: (): Promise<InventoryAnalyticsResponse> =>
      retailerApi
        .get("/dashboard/inventory-analytics")
        .then((r) => r.data as InventoryAnalyticsResponse),
    shopPerformance: (
      params: ShopPerformanceParams = {}
    ): Promise<ShopPerformanceResponse> =>
      retailerApi
        .get("/dashboard/shop-performance", { params })
        .then((r) => r.data as ShopPerformanceResponse),
  },

  // Inventory Management
  inventory: {
    summary: (): Promise<InventorySummaryResponse> =>
      retailerApi
        .get("/inventory/summary")
        .then((r) => r.data as InventorySummaryResponse),
    companies: (): Promise<CompaniesResponse> =>
      retailerApi
        .get("/inventory/companies")
        .then((r) => r.data as CompaniesResponse),
    addCompany: (data: AddCompanyRequest): Promise<AddCompanyResponse> =>
      retailerApi
        .post("/inventory/companies", data)
        .then((r) => r.data as AddCompanyResponse),
    // NOTE: Update company endpoint not in retailer docs (endpoints 3-31); intentionally omitted to stay in sync.
    productsByCompany: (
      companyId: number,
      params: {
        eyewearType?: "GLASSES" | "SUNGLASSES" | "LENSES";
        page?: number;
        limit?: number;
      } = {}
    ): Promise<ProductsByCompanyResponse> =>
      retailerApi
        .get(`/inventory/companies/${companyId}/products`, { params })
        .then((r) => r.data as ProductsByCompanyResponse),
    addProduct: (data: AddProductRequest): Promise<AddProductResponse> =>
      retailerApi
        .post("/inventory/products", data)
        .then((r) => r.data as AddProductResponse),
    updateProduct: (
      productId: number,
      data: UpdateProductRequest
    ): Promise<UpdateProductResponse> =>
      retailerApi
        .put(`/inventory/products/${productId}`, data)
        .then((r) => r.data as UpdateProductResponse),
    myProducts: (
      params: {
        companyId?: number;
        eyewearType?: "GLASSES" | "SUNGLASSES" | "LENSES";
        lowStock?: boolean;
        outOfStock?: boolean;
        search?: string;
        page?: number;
        limit?: number;
      } = {}
    ): Promise<RetailerProductsListResponse> =>
      retailerApi
        .get("/inventory/my-products", { params })
        .then((r) => r.data as RetailerProductsListResponse),
    getProduct: (retailerProductId: number): Promise<RetailerProductRecord> =>
      retailerApi
        .get(`/inventory/my-products/${retailerProductId}`)
        .then((r) => r.data as RetailerProductRecord),
    addRetailerProduct: (
      data: AddRetailerProductRequest
    ): Promise<AddRetailerProductResponse> =>
      retailerApi
        .post("/inventory/my-products", data)
        .then((r) => r.data as AddRetailerProductResponse),
    updateStock: (
      retailerProductId: number,
      data: UpdateStockRequest
    ): Promise<UpdateStockResponse> =>
      retailerApi
        .put(`/inventory/my-products/${retailerProductId}/stock`, data)
        .then((r) => r.data as UpdateStockResponse),
    updateRetailerProduct: (
      retailerProductId: number,
      data: UpdateRetailerProductRequest
    ): Promise<UpdateRetailerProductResponse> =>
      retailerApi
        .put(`/inventory/my-products/${retailerProductId}`, data)
        .then((r) => r.data as UpdateRetailerProductResponse),
  },

  // Shop & Distribution Management
  shops: {
    getAll: (
      params: RetailerShopsParams = {}
    ): Promise<RetailerShopsResponse> => {
      // Map deprecated 'active' -> 'isActive' for backward compatibility
      const finalParams: Record<string, unknown> = { ...params };
      if (
        (finalParams as unknown as Record<string, unknown>).active !==
          undefined &&
        finalParams.isActive === undefined
      ) {
        finalParams.isActive = (
          finalParams as unknown as Record<string, unknown>
        ).active;
        delete (finalParams as unknown as Record<string, unknown>).active;
      }
      return retailerApi
        .get("/shops", { params: finalParams })
        .then((r) => r.data as RetailerShopsResponse);
    },
    add: (data: AddShopRequest): Promise<AddShopResponse> =>
      retailerApi.post("/shops", data).then((r) => r.data as AddShopResponse),
    updatePartnership: (
      retailerShopId: number,
      data: UpdateShopRelationshipRequest
    ): Promise<UpdateShopRelationshipResponse> =>
      retailerApi
        .put(`/shops/${retailerShopId}`, data)
        .then((r) => r.data as UpdateShopRelationshipResponse),
    // Endpoint 32: Get Available Shops for Connection
    available: (): Promise<AvailableShopsResponse> =>
      retailerApi
        .get("/shops/available")
        .then((r) => r.data as AvailableShopsResponse),
    // Endpoint 33: Get My Shop Network with Enhanced Analytics
    myNetwork: (): Promise<MyShopNetworkResponse> =>
      retailerApi
        .get("/shops/my-network")
        .then((r) => r.data as MyShopNetworkResponse),
  },

  // Distribution Management
  distributions: {
    getAll: (
      params: DistributionsListParams = {}
    ): Promise<DistributionsListResponse> => {
      const { retailerShopId, shopId, ...rest } = params;
      const finalParams: Record<string, unknown> = { ...rest };
      if (shopId !== undefined) finalParams.shopId = shopId;
      else if (retailerShopId !== undefined)
        finalParams.shopId = retailerShopId;
      return retailerApi
        .get("/distributions", { params: finalParams })
        .then((r) => r.data as DistributionsListResponse);
    },
    getByShop: (
      retailerShopId: number,
      params: ShopDistributionsParams = {}
    ): Promise<ShopDistributionsResponse> =>
      retailerApi
        .get(`/shops/${retailerShopId}/distributions`, { params })
        .then((r) => r.data as ShopDistributionsResponse),
    create: (
      data: CreateDistributionRequest
    ): Promise<CreateDistributionResponse> =>
      retailerApi
        .post("/distributions", data)
        .then((r) => r.data as CreateDistributionResponse),
    // Delivery/payment status update endpoints are not in the official 31 documented endpoints; removed for spec alignment.
  },

  // Bulk Operations
  bulk: {
    getTemplate: (): Promise<
      Array<{
        sku: string;
        name: string;
        description: string;
        companyName: string;
        companyDescription: string;
        eyewearType: string;
        frameType: string | null;
        material: string;
        color: string;
        size: string | null;
        model: string;
        barcode: string;
        basePrice: number;
        sellingPrice: number;
        quantity: number;
        minStockLevel: number;
        maxStockLevel: number;
      }>
    > => retailerApi.get("/bulk/template").then((r) => r.data),

    uploadProducts: (data: {
      products: Array<{
        sku: string;
        name: string;
        description: string;
        companyName: string;
        companyDescription: string;
        eyewearType: string;
        frameType?: string | null;
        material: string;
        color: string;
        size?: string | null;
        model: string;
        barcode: string;
        basePrice: number;
        sellingPrice: number;
        quantity: number;
        minStockLevel: number;
        maxStockLevel: number;
      }>;
    }): Promise<{
      message: string;
      summary: { total: number; successful: number; failed: number };
      products: Array<{
        id: number;
        name: string;
        sku: string;
        company: string;
        quantity: number;
        sellingPrice: number;
      }>;
      errors: Array<{
        row: number;
        product: string;
        errors: string[];
      }>;
      hasMoreProducts: boolean;
      hasMoreErrors: boolean;
    }> => retailerApi.post("/bulk/products/upload", data).then((r) => r.data),

    updateInventory: (data: {
      updates: Array<{
        sku: string;
        quantity?: number;
        sellingPrice?: number;
        minStockLevel?: number;
        maxStockLevel?: number;
      }>;
    }): Promise<{
      message: string;
      summary: { total: number; successful: number; failed: number };
      errors: Array<{
        row: number;
        sku: string;
        error: string;
      }>;
    }> => retailerApi.post("/bulk/inventory/update", data).then((r) => r.data),

    distribute: (data: {
      distributions: Array<{
        retailerShopId: number;
        productId: number;
        quantity: number;
        unitPrice: number;
        totalPrice: number;
      }>;
    }): Promise<{
      message: string;
      summary: { total: number; successful: number; failed: number };
      distributions: Array<{
        distributionId: number;
        shopId: number;
        productId: number;
        quantity: number;
        status: string;
      }>;
      errors: Array<{ row: number; error: string }>;
    }> =>
      retailerApi.post("/bulk/distributions/create", data).then((r) => r.data),
  },
  reports: {
    getAll: (
      params: { page?: number; limit?: number } = {}
    ): Promise<ReportsListResponse> =>
      retailerApi
        .get("/reports", { params })
        .then((r) => r.data as ReportsListResponse),
    profitLoss: (
      params: ProfitLossParams & { format?: "json" | "pdf" } = {}
    ): Promise<ProfitLossResponse> =>
      retailerApi
        .get("/reports/profit-loss", { params })
        .then((r) => r.data as ProfitLossResponse),
    taxReport: (
      params: TaxReportParams & { format?: "json" | "pdf" } = {}
    ): Promise<TaxReportResponse> =>
      retailerApi
        .get("/reports/tax-report", { params })
        .then((r) => r.data as TaxReportResponse),
    stockValuation: (): Promise<StockValuationResponse> =>
      retailerApi
        .get("/reports/stock-valuation")
        .then((r) => r.data as StockValuationResponse),
    delete: (reportId: number): Promise<DeleteReportResponse> =>
      retailerApi
        .delete(`/reports/${reportId}`)
        .then((r) => r.data as DeleteReportResponse),
  },

  // Profile & Authentication
  profile: {
    get: () => retailerApi.get("/auth/profile").then((r) => r.data),
    update: (data: { name?: string; phone?: string; address?: string }) =>
      retailerApi.put("/auth/profile", data).then((r) => r.data),
    changePassword: (data: { currentPassword: string; newPassword: string }) =>
      retailerApi.put("/auth/change-password", data).then((r) => r.data),
    // refresh-token not part of documented endpoints 3-31; omitted.
  },
};

// ============================================================================
// DOCTOR API ENDPOINTS
// ============================================================================
export const DoctorAPI = {
  // Auth & Session (login handles attendance per backend spec)
  auth: {
    login: (data: { email: string; password: string }) =>
      doctorApi.post("/login", data).then((r) => r.data),
    logout: () => doctorApi.post("/logout").then((r) => r.data),
  },

  // Patients (shop scoped automatically by token)
  patients: {
    // Return EXACT documented shape: { success, data: Patient[], count }
    getAll: (): Promise<PatientsResponse> =>
      doctorApi.get("/patients").then((r) => r.data as PatientsResponse),
  },

  // Prescriptions
  prescriptions: {
    // Create prescription: returns documented shape
    create: (
      data: PrescriptionCreatePayload
    ): Promise<PrescriptionCreateResponse> =>
      doctorApi
        .post("/prescriptions", data)
        .then((r) => r.data as PrescriptionCreateResponse),
    // List prescriptions: returns documented shape { prescriptions, total, page, totalPages }
    list: (
      params: { page?: number; limit?: number; patientId?: number } = {}
    ): Promise<PrescriptionsListResponse> =>
      doctorApi
        .get("/prescriptions", { params })
        .then((r) => r.data as PrescriptionsListResponse),
    // Detail returns the prescription object directly
    getById: (id: number): Promise<PrescriptionDetailResponse> =>
      doctorApi
        .get(`/prescriptions/${id}`)
        .then((r) => r.data as PrescriptionDetailResponse),
    getPdf: (id: number) =>
      doctorApi
        .get(`/prescriptions/${id}/pdf`, { responseType: "blob" })
        .then((r) => r.data as Blob),
    getThermal: (id: number) =>
      doctorApi
        .get(`/prescriptions/${id}/thermal`, { responseType: "text" })
        .then((r) => r.data as string),
  },
};

// Create shop admin specific axios instance
const shopAdminApi = axios.create({
  baseURL: `${BASE_URL}/shop-admin`,
  headers: { "Content-Type": "application/json" },
});

// Shop Admin API interceptor
shopAdminApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("jwt");
  if (token) {
    const value = `Bearer ${token}`;
    if (config.headers instanceof AxiosHeaders) {
      config.headers.set("Authorization", value);
    } else {
      const plain = {
        ...(config.headers as Record<string, unknown>),
        Authorization: value,
      };
      config.headers = plain as unknown as AxiosRequestHeaders;
    }
  }

  logApiCall(config.method || "GET", config.url || "", config.data);
  return config;
});

// Shop Admin API response interceptor
shopAdminApi.interceptors.response.use(
  (res: AxiosResponse) => {
    console.log("✅ Shop Admin API Response:", res.config.url, {
      status: res.status,
      data: res.data,
      timestamp: new Date().toISOString(),
    });
    return res;
  },
  (error) => {
    console.error("❌ Shop Admin API Error:", error.config?.url, {
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      timestamp: new Date().toISOString(),
    });

    const message =
      error?.response?.data?.error ||
      error?.response?.data?.message ||
      error.message ||
      "Request failed";
    return Promise.reject(new Error(message));
  }
);

// ============================================================================
// SHOP ADMIN API ENDPOINTS
// ============================================================================
export const ShopAdminAPI = {
  // Dashboard
  dashboard: {
    getMetrics: (): Promise<import("./types/shopAdmin").ShopAdminMetrics> =>
      shopAdminApi.get("/dashboard/metrics").then((r) => r.data),
    getActivities: (
      params: {
        page?: number;
        limit?: number;
        type?: string;
        days?: number;
      } = {}
    ): Promise<import("./types/shopAdmin").ActivitiesResponse> =>
      shopAdminApi.get("/dashboard/activities", { params }).then((r) => r.data),
    getGrowth: (
      period: import("./types/shopAdmin").GrowthPeriod = "monthly"
    ): Promise<import("./types/shopAdmin").GrowthResponse> =>
      shopAdminApi
        .get("/dashboard/growth", { params: { period } })
        .then((r) => r.data),
  },

  // Staff Management
  staff: {
    register: (data: {
      email: string;
      password: string;
      name: string;
      role: string;
      shopId: number;
    }) => staffApi.post("/api/auth/register", data).then((r) => r.data),
    getAll: (
      params: {
        page?: number;
        limit?: number;
        status?: "ACTIVE" | "INACTIVE" | "ALL";
      } = {}
    ) => shopAdminApi.get("/staff", { params }).then((r) => r.data),
    getById: (staffId: number) =>
      shopAdminApi.get(`/staff/${staffId}`).then((r) => r.data),
    getActivities: (staffId: number, startDate?: string, endDate?: string) =>
      shopAdminApi
        .get("/staff/activities", {
          params: {
            staffId,
            startDate: startDate || "2025-09-01",
            endDate: endDate || "2025-09-30",
          },
        })
        .then((r) => r.data),
  },

  // Doctors Management
  doctors: {
    add: (data: {
      email: string;
      name: string;
      phone?: string;
      qualification?: string;
      specialization?: string;
      experience?: number;
    }) => shopAdminApi.post("/doctors/add", data).then((r) => r.data),
    getAll: () => shopAdminApi.get("/doctors").then((r) => r.data),
    updateStatus: (doctorId: number, isActive: boolean) =>
      shopAdminApi
        .put(`/doctors/${doctorId}/status`, { isActive })
        .then((r) => r.data),
  },

  // Reports
  reports: {
    getSales: (period: string = "monthly") =>
      shopAdminApi
        .get("/reports/sales", { params: { period } })
        .then((r) => r.data),
    getProductSales: (startDate: string, endDate: string, productId?: number) =>
      shopAdminApi
        .get("/reports/sales/products", {
          params: { startDate, endDate, productId },
        })
        .then((r) => r.data),
    getStaffSales: (startDate: string, endDate: string) =>
      shopAdminApi
        .get("/reports/sales/staff", { params: { startDate, endDate } })
        .then((r) => r.data),
    getPatients: (
      type: string = "active",
      startDate: string,
      endDate: string
    ) =>
      shopAdminApi
        .get("/reports/patients", { params: { type, startDate, endDate } })
        .then((r) => r.data),
    getPatientVisits: (patientId: number, startDate: string, endDate: string) =>
      shopAdminApi
        .get("/reports/patients/visits", {
          params: { patientId, startDate, endDate },
        })
        .then((r) => r.data),
    getInventory: (type: string = "all", startDate: string, endDate: string) =>
      shopAdminApi
        .get("/reports/inventory", { params: { type, startDate, endDate } })
        .then((r) => r.data),
    getInventoryAlerts: () =>
      shopAdminApi.get("/reports/inventory/alerts").then((r) => r.data),
    getInventoryStatus: () =>
      shopAdminApi.get("/reports/inventory/status").then((r) => r.data),
  },

  // Inventory Management
  inventory: {
    // POST /shop-admin/inventory/stock-in
    stockIn: (data: {
      productId?: number;
      barcode?: string;
      quantity: number;
      costPrice?: number;
      supplier?: string;
      notes?: string;
    }) => shopAdminApi.post("/inventory/stock-in", data).then((r) => r.data),

    // POST /shop-admin/inventory/adjust
    adjust: (data: {
      productId?: number;
      barcode?: string;
      type: "ADD" | "REMOVE";
      quantity: number;
      reason?: string;
      notes?: string;
    }) => shopAdminApi.post("/inventory/adjust", data).then((r) => r.data),

    // GET /shop-admin/inventory/status
    getStatus: (
      params: {
        page?: number;
        limit?: number;
        lowStock?: boolean;
        sortBy?: "name" | "stock" | "updatedAt" | string;
        sortOrder?: "asc" | "desc";
        search?: string;
      } = {}
    ) => shopAdminApi.get("/inventory/status", { params }).then((r) => r.data),
  },

  // Stock Management
  stock: {
    // GET /shop-admin/stock/receipts
    getReceipts: (
      params: {
        page?: number;
        limit?: number;
        status?: "PENDING" | "APPROVED" | "REJECTED" | "ALL";
        sortBy?: "createdAt" | "status" | "quantity" | string;
        sortOrder?: "asc" | "desc";
      } = {}
    ) => shopAdminApi.get("/stock/receipts", { params }).then((r) => r.data),

    // PUT /shop-admin/stock/receipts/:id/verify
    verifyReceipt: (
      receiptId: number,
      data: {
        decision: "APPROVED" | "REJECTED";
        verifiedQuantity?: number;
        adminNotes?: string;
        discrepancyReason?: string;
      }
    ) =>
      shopAdminApi
        .put(`/stock/receipts/${receiptId}/verify`, data)
        .then((r) => r.data),

    // Incoming Shipments Management
    incomingShipments: {
      // GET /shop-admin/stock/incoming-shipments
      getAll: (
        params: import("./types/shopAdmin").IncomingShipmentsParams = {}
      ): Promise<import("./types/shopAdmin").IncomingShipmentsListResponse> =>
        shopAdminApi
          .get("/stock/incoming-shipments", { params })
          .then((r) => r.data),

      // GET /shop-admin/stock/incoming-shipments/:id
      getDetail: (
        id: number
      ): Promise<import("./types/shopAdmin").IncomingShipmentDetailResponse> =>
        shopAdminApi.get(`/stock/incoming-shipments/${id}`).then((r) => r.data),

      // PATCH /shop-admin/stock/incoming-shipments/:id/receive
      updateStatus: (
        id: number,
        data: import("./types/shopAdmin").UpdateShipmentStatusRequest
      ): Promise<import("./types/shopAdmin").UpdateShipmentStatusResponse> =>
        shopAdminApi
          .patch(`/stock/incoming-shipments/${id}/receive`, data)
          .then((r) => r.data),
    },
  },
};

// ============================================================================
// LEGACY API COMPATIBILITY - For existing components
// ============================================================================
export const api = {
  // Maintain backward compatibility
  patients: StaffAPI.patients,
  customers: StaffAPI.customers,
  inventory: StaffAPI.inventory,
  invoices: StaffAPI.invoices,
  prescriptions: StaffAPI.prescriptions,
};

// ============================================================================
// EXPORTS
// ============================================================================
export default apiClient;

// Export specific instances if needed
export { staffApi, retailerApi, shopAdminApi };

// Export type definitions
export type StaffApiError = Error & { status?: number };
export type RetailerApiError = Error & { status?: number };
export type ApiError = Error & { status?: number };
