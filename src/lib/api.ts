import axios, { AxiosHeaders, type AxiosRequestHeaders, type AxiosResponse } from 'axios';
import { store } from '../store';
import { logout } from '../store/authSlice';

// ============================================================================
// BASE AXIOS CONFIGURATION
// ============================================================================

export const BASE_URL = 'https://staff-production-bf87.up.railway.app';

// Utility function for consistent API logging
const logApiCall = (method: string, url: string, data?: unknown, response?: unknown) => {
  console.log(`🔄 API ${method.toUpperCase()}: ${url}`, {
    request: data && Object.keys(data).length > 0 ? data : 'No data',
    response: response ? 'Response received' : 'No response yet',
    timestamp: new Date().toISOString()
  });
};

// Create main axios instance
const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Create staff-specific axios instance
const staffApi = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Create retailer-specific axios instance  
const retailerApi = axios.create({
  baseURL: `${BASE_URL}/retailer`,
  headers: { 'Content-Type': 'application/json' },
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
    
    logApiCall(config.method || 'GET', config.url || '', config.data);
    return config;
  },
  (error) => {
    console.error('❌ API Request Error:', error);
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
      const plain = { ...(config.headers as Record<string, unknown>), Authorization: value };
      config.headers = plain as unknown as AxiosRequestHeaders;
    }
  }
  
  logApiCall(config.method || 'GET', config.url || '', config.data);
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
      const plain = { ...(config.headers as Record<string, unknown>), Authorization: value };
      config.headers = plain as unknown as AxiosRequestHeaders;
    }
  }
  
  logApiCall(config.method || 'GET', config.url || '', config.data);
  return config;
});

// ============================================================================
// RESPONSE INTERCEPTORS - Handle errors and logging
// ============================================================================

// Main API Client response interceptor
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log('✅ API Response:', response.config.url, { 
      status: response.status, 
      data: response.data,
      timestamp: new Date().toISOString()
    });
    return response;
  },
  (error) => {
    console.error('❌ API Error:', error.config?.url, {
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      timestamp: new Date().toISOString()
    });
    
    if (error.response?.status === 401) {
      const state = store.getState();
      const userType = state.auth.type;
      
      store.dispatch(logout());
      
      // Role-aware redirect
      if (userType === 'shopAdmin') {
        window.location.href = '/shop-admin-login';
      } else {
        window.location.href = '/staff-login';
      }
    }
    
    return Promise.reject(error);
  }
);

// Staff API response interceptor
staffApi.interceptors.response.use(
  (res: AxiosResponse) => {
    console.log('✅ Staff API Response:', res.config.url, { 
      status: res.status, 
      data: res.data,
      timestamp: new Date().toISOString()
    });
    return res;
  },
  (error) => {
    console.error('❌ Staff API Error:', error.config?.url, {
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      timestamp: new Date().toISOString()
    });
    
    const message = error?.response?.data?.error || error?.response?.data?.message || error.message || "Request failed";
    return Promise.reject(new Error(message));
  }
);

// Retailer API response interceptor
retailerApi.interceptors.response.use(
  (res: AxiosResponse) => {
    console.log('✅ Retailer API Response:', res.config.url, { 
      status: res.status, 
      data: res.data,
      timestamp: new Date().toISOString()
    });
    return res;
  },
  (error) => {
    console.error('❌ Retailer API Error:', error.config?.url, {
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      timestamp: new Date().toISOString()
    });
    
    const message = error?.response?.data?.error || error?.response?.data?.message || error.message || "Request failed";
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
  // Patient Management
  patients: {
    getAll: (params: { page?: number; limit?: number; search?: string } = {}) =>
      staffApi.get('/patients', { params }).then((r) => r.data),
    getById: (id: number) => 
      staffApi.get(`/patients/${id}`).then((r) => r.data),
    create: (data: { 
      name: string; 
      age?: number; 
      gender?: string; 
      phone?: string; 
      address?: string; 
      medicalHistory?: string;
    }) => staffApi.post('/patients', data).then((r) => r.data),
    update: (id: number, data: {
      name?: string;
      age?: number;
      gender?: string;
      phone?: string;
      address?: string;
      medicalHistory?: string;
    }, shopId?: number) => {
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
    getAll: () => apiClient.get('/api/customer'),
    getById: (id: number) => apiClient.get(`/api/customer/${id}`),
    create: (data: {
      name: string;
      phone: string;
      address: string;
      shopId: number;
    }) => apiClient.post('/api/customer', data),
    createWithInvoice: (data: {
      customer: {
        name: string;
        phone: string;
        address: string;
        shopId: number;
      };
      items: Array<{
        productId: number;
        quantity: number;
        unitPrice: number;
      }>;
      subtotal: number;
      totalAmount: number;
      cgst: number;
      sgst: number;
    }) => apiClient.post('/api/customer/invoice', data),
  },

  // Inventory & Barcode Management
  inventory: {
    getAll: (params?: {
      eyewearType?: string;
      companyId?: number;
      frameType?: string;
    }) => apiClient.get('/api/inventory', { params }),
    getInventory: () => staffApi.get('/').then((r) => r.data),
    addProduct: (data: {
      name: string; 
      description?: string; 
      barcode?: string; 
      sku?: string; 
      basePrice: number;
      eyewearType: string; 
      frameType?: string; 
      companyId: number; 
      material?: string; 
      color?: string; 
      size?: string; 
      model?: string;
    }) => staffApi.post('/product', data).then((r) => r.data),
    getProductByBarcode: (barcode: string) => 
      staffApi.get(`/product/barcode/${encodeURIComponent(barcode)}`).then((r) => r.data),
    stockByBarcode: (data: { barcode: string; quantity: number; price: number }) =>
      staffApi.post("/stock-by-barcode", data).then((r) => r.data),
    stockOutByBarcode: (data: { barcode: string; quantity: number }) =>
      staffApi.post("/stock-out-by-barcode", data).then((r) => r.data),
    updateStockByBarcode: (data: {
      barcode: string;
      quantity: number;
      price?: number;
      shopId: number;
    }) => apiClient.post('/api/inventory/stock-by-barcode', data),
    stockIn: (data: {
      productId?: number;
      barcode?: string;
      quantity: number;
    }) => apiClient.post('/api/inventory/stock-in', data),
    stockOut: (data: {
      productId?: number;
      barcode?: string;
      quantity: number;
    }) => apiClient.post('/api/inventory/stock-out', data),
    updateProduct: (
      productId: number,
      data: Partial<{
        name: string;
        description?: string;
        barcode?: string;
        sku?: string;
        basePrice: number;
        eyewearType: 'GLASSES' | 'SUNGLASSES' | 'LENSES';
        frameType?: string;
        companyId: number;
        material?: string;
        color?: string;
        size?: string;
        model?: string;
      }>
    ) => apiClient.put(`/api/inventory/product/${productId}`, data),
  },

  // Invoice Management
  invoices: {
    getAll: () => apiClient.get('/api/invoice'),
    getById: (id: number) => apiClient.get(`/api/invoice/${id}`),
    getInvoice: (id: number) => staffApi.get(`/invoices/${id}`).then((r) => r.data),
    create: (data: {
      customerId?: number;
      patientId?: number; 
      items: Array<{ 
        productId: number; 
        quantity: number; 
        discount?: number; 
        cgst?: number; 
        sgst?: number;
        unitPrice?: number;
        taxRate?: number;
      }>; 
      totalIgst?: number;
      subtotal?: number;
      totalAmount?: number;
      cgst?: number;
      sgst?: number;
      notes?: string;
      shopId?: number;
      paymentMethod?: string;
    }) => {
      // Try staff API format first, fallback to general API
      if (data.patientId || (!data.customerId && data.patientId !== undefined)) {
        return staffApi.post('/invoices', data).then((r) => r.data);
      }
      return apiClient.post('/api/invoice', data);
    },
    updateStatus: (id: number, status: 'PAID' | 'UNPAID' | 'PARTIALLY_PAID' | string) =>
      staffApi.patch(`/invoices/${id}/status`, { status }).then((r) => r.data),
    addPayment: (id: number, data: { 
      amount: number; 
      paymentMethod: 'CASH' | 'UPI' | 'CARD' | 'GIFT_CARD' | string; 
      giftCardCode?: string;
      reference?: string;
      date?: string;
      notes?: string;
    }) => staffApi.post(`/invoices/${id}/payment`, data).then((r) => r.data),
    cancelInvoice: (id: number) => staffApi.delete(`/invoices/${id}`).then((r) => r.data),
    delete: (id: number) => apiClient.delete(`/api/invoice/${id}`),
    getPdf: (id: number) => apiClient.get(`/api/invoice/${id}/pdf`),
  },

  // Prescription Management
  prescriptions: {
    getAll: () => apiClient.get('/api/prescription'),
    getById: (id: number) => apiClient.get(`/api/prescription/${id}`),
    listPrescriptions: (params: { page?: number; limit?: number; patientId?: number } = {}) =>
      staffApi.get('/prescriptions', { params }).then((r) => r.data),
    getPrescription: (id: number) => staffApi.get(`/prescriptions/${id}`).then((r) => r.data),
    create: (data: {
      patientId: number;
      rightEye?: { sph?: string; cyl?: string; axis?: string; add?: string };
      leftEye?: { sph?: string; cyl?: string; axis?: string; add?: string };
      sphereLeft?: number;
      sphereRight?: number;
      cylinderLeft?: number;
      cylinderRight?: number;
      axisLeft?: number;
      axisRight?: number;
      addLeft?: number;
      addRight?: number;
      pupilDistance?: number;
      notes?: string;
      shopId?: number;
      doctor?: string;
      date?: string;
    }) => {
      // Support both formats - staff API and general API
      if (data.rightEye || data.leftEye) {
        return staffApi.post('/prescriptions', data).then((r) => r.data);
      }
      return apiClient.post('/api/prescription', data);
    },
    getPdf: (id: number) => staffApi.get(`/prescriptions/${id}/pdf`, { responseType: 'blob' }).then((r) => r.data as Blob),
    getPrescriptionThermal: (id: number) => staffApi.get(`/prescriptions/${id}/thermal`, { responseType: 'text' }).then((r) => r.data as string),
    getThermal: (id: number) => apiClient.get(`/api/prescription/${id}/thermal`),
  },

  // Reports
  reports: {
    dailyReport: (date: string) => staffApi.get('/reports/daily', { params: { date } }).then((r) => r.data),
    monthlyReport: (year: number, month: number) => staffApi.get('/reports/monthly', { params: { year, month } }).then((r) => r.data),
    staffSalesReport: (startDate: string, endDate: string) => staffApi.get('/reports/staff-sales', { params: { startDate, endDate } }).then((r) => r.data),
    salesByPriceTier: (startDate: string, endDate: string) => staffApi.get('/reports/sales-by-price-tier', { params: { startDate, endDate } }).then((r) => r.data),
    bestSellersByPriceTier: (startDate: string, endDate: string, limit?: number) => staffApi.get('/reports/best-sellers-by-price-tier', { params: { startDate, endDate, limit } }).then((r) => r.data),
  },

  // Royalty System
  royalty: {
    addRoyaltyPoints: (patientId: number) => staffApi.post('/royalty', { patientId }).then((r) => r.data),
    getRoyaltyPoints: (patientId: number) => staffApi.get(`/royalty/${patientId}`).then((r) => r.data),
  },

  // Stock Receipts
  stockReceipts: {
    create: (data: { 
      productId: number; 
      receivedQuantity: number; 
      supplierName?: string; 
      deliveryNote?: string; 
      batchNumber?: string; 
      expiryDate?: string 
    }) => staffApi.post('/api/stock-receipts', data).then((r) => r.data),
    getAll: (params: { status?: string } = {}) => staffApi.get('/api/stock-receipts', { params }).then((r) => r.data),
    getById: (id: number) => staffApi.get(`/api/stock-receipts/${id}`).then((r) => r.data),
  },

  // Gift Cards
  giftCards: {
    issue: (patientId: number, balance: number) => staffApi.post('/api/gift-cards/issue', { patientId, balance }).then((r) => r.data),
    redeem: (code: string, amount: number) => staffApi.post('/api/gift-cards/redeem', { code, amount }).then((r) => r.data),
    getBalance: (code: string) => staffApi.get(`/api/gift-cards/${code}`).then((r) => r.data),
  },
};

// ============================================================================
// RETAILER API ENDPOINTS  
// ============================================================================
export const RetailerAPI = {
  // Dashboard Analytics
  dashboard: {
    overview: () => retailerApi.get("/dashboard/overview").then((r) => r.data),
    salesAnalytics: (params: { period?: string; startDate?: string; endDate?: string } = {}) =>
      retailerApi.get("/dashboard/sales-analytics", { params }).then((r) => r.data),
    inventoryAnalytics: () => retailerApi.get("/dashboard/inventory-analytics").then((r) => r.data),
    shopPerformance: (params: { period?: string; shopId?: number } = {}) =>
      retailerApi.get("/dashboard/shop-performance", { params }).then((r) => r.data),
  },

  // Inventory Management
  inventory: {
    summary: () => retailerApi.get("/inventory/summary").then((r) => r.data),
    companies: () => retailerApi.get("/inventory/companies").then((r) => r.data),
    addCompany: (data: { name: string; description?: string }) =>
      retailerApi.post("/inventory/companies", data).then((r) => r.data),
    updateCompany: (companyId: number, data: { name?: string; description?: string }) =>
      retailerApi.put(`/inventory/companies/${companyId}`, data).then((r) => r.data),
    productsByCompany: (
      companyId: number,
      params: { eyewearType?: 'GLASSES' | 'SUNGLASSES' | 'LENSES'; page?: number; limit?: number } = {}
    ) => retailerApi.get(`/inventory/companies/${companyId}/products`, { params }).then((r) => r.data),
    addProduct: (data: {
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
    }) => retailerApi.post("/inventory/products", data).then((r) => r.data),
    updateProduct: (productId: number, data: Record<string, unknown>) =>
      retailerApi.put(`/inventory/products/${productId}`, data).then((r) => r.data),
    myProducts: (params: {
      companyId?: number;
      eyewearType?: 'GLASSES' | 'SUNGLASSES' | 'LENSES';
      lowStock?: boolean;
      outOfStock?: boolean;
      search?: string;
      page?: number;
      limit?: number;
    } = {}) => retailerApi.get("/inventory/my-products", { params }).then((r) => r.data),
    addRetailerProduct: (data: {
      productId: number;
      wholesalePrice: number;
      mrp: number;
      minSellingPrice?: number;
      initialStock?: number;
      reorderLevel?: number;
      warehouseLocation?: string;
      supplier?: string;
      costPrice?: number;
    }) => retailerApi.post('/inventory/my-products', data).then((r) => r.data),
    updateStock: (retailerProductId: number, data: {
      quantity: number;
      type: 'ADD' | 'REMOVE';
      reason?: string;
      costPrice?: number;
      supplier?: string;
      warehouseLocation?: string;
      batchNumber?: string;
      expiryDate?: string;
    }) => retailerApi.put(`/inventory/my-products/${retailerProductId}/stock`, data).then((r) => r.data),
    updateRetailerProduct: (retailerProductId: number, data: Record<string, unknown>) =>
      retailerApi.put(`/inventory/my-products/${retailerProductId}`, data).then((r) => r.data),
  },

  // Shop & Distribution Management
  shops: {
    getAll: (params: Record<string, unknown> = {}) => retailerApi.get("/shops", { params }).then((r) => r.data),
    add: (data: { 
      shopId: number; 
      partnershipType: 'FRANCHISE' | 'DEALER' | 'DISTRIBUTOR'; 
      commissionRate?: number; 
      creditLimit?: number; 
      paymentTerms?: string 
    }) => retailerApi.post('/shops', data).then((r) => r.data),
    updatePartnership: (retailerShopId: number, data: { 
      commissionRate?: number; 
      creditLimit?: number; 
      paymentTerms?: string; 
      isActive?: boolean 
    }) => retailerApi.put(`/shops/${retailerShopId}`, data).then((r) => r.data),
  },

  // Distribution Management
  distributions: {
    getAll: (params: Record<string, unknown> = {}) => retailerApi.get("/distributions", { params }).then((r) => r.data),
    getByShop: (retailerShopId: number, params: Record<string, unknown> = {}) =>
      retailerApi.get(`/shops/${retailerShopId}/distributions`, { params }).then((r) => r.data),
    create: (data: {
      retailerShopId: number;
      distributions: { retailerProductId: number; quantity: number; unitPrice: number }[];
      notes?: string;
      paymentDueDate?: string;
    }) => retailerApi.post('/distributions', data).then((r) => r.data),
    updateDeliveryStatus: (distributionId: number, data: { 
      deliveryStatus: string; 
      deliveryDate?: string; 
      trackingNumber?: string 
    }) => retailerApi.put(`/distributions/${distributionId}/delivery-status`, data).then((r) => r.data),
    updatePaymentStatus: (distributionId: number, data: { 
      paymentStatus: string; 
      paidDate?: string 
    }) => retailerApi.put(`/distributions/${distributionId}/payment-status`, data).then((r) => r.data),
  },

  // Reports & Analytics
  reports: {
    getAll: (params: Record<string, unknown> = {}) => retailerApi.get("/reports", { params }).then((r) => r.data),
    profitLoss: (params: { startDate: string; endDate: string; format?: 'json' | 'pdf' }) =>
      retailerApi.get("/reports/profit-loss", { params }).then((r) => r.data),
    taxReport: (params: { startDate: string; endDate: string; format?: 'json' | 'pdf' }) =>
      retailerApi.get("/reports/tax-report", { params }).then((r) => r.data),
    stockValuation: () => retailerApi.get("/reports/stock-valuation").then((r) => r.data),
    delete: (reportId: number) => retailerApi.delete(`/reports/${reportId}`).then((r) => r.data),
  },

  // Profile & Authentication
  profile: {
    get: () => retailerApi.get('/auth/profile').then((r) => r.data),
    update: (data: { 
      name?: string; 
      companyName?: string; 
      phone?: string; 
      address?: string; 
      gstNo?: string; 
      licenseNo?: string 
    }) => retailerApi.put('/auth/profile', data).then((r) => r.data),
    changePassword: (data: { currentPassword: string; newPassword: string }) =>
      retailerApi.put('/auth/change-password', data).then((r) => r.data),
    refreshToken: () => retailerApi.post('/auth/refresh-token').then((r) => r.data),
  },
};

// Create shop admin specific axios instance
const shopAdminApi = axios.create({
  baseURL: `${BASE_URL}/shop-admin`,
  headers: { 'Content-Type': 'application/json' },
});

// Shop Admin API interceptor
shopAdminApi.interceptors.request.use((config) => {
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
  
  logApiCall(config.method || 'GET', config.url || '', config.data);
  return config;
});

// Shop Admin API response interceptor
shopAdminApi.interceptors.response.use(
  (res: AxiosResponse) => {
    console.log('✅ Shop Admin API Response:', res.config.url, { 
      status: res.status, 
      data: res.data,
      timestamp: new Date().toISOString()
    });
    return res;
  },
  (error) => {
    console.error('❌ Shop Admin API Error:', error.config?.url, {
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      timestamp: new Date().toISOString()
    });
    
    const message = error?.response?.data?.error || error?.response?.data?.message || error.message || "Request failed";
    return Promise.reject(new Error(message));
  }
);

// ============================================================================
// SHOP ADMIN API ENDPOINTS
// ============================================================================
export const ShopAdminAPI = {
  // Dashboard
  dashboard: {
    getMetrics: (): Promise<import('./types/shopAdmin').ShopAdminMetrics> => 
      shopAdminApi.get('/dashboard/metrics').then((r) => r.data),
    getActivities: (
      params: { page?: number; limit?: number; type?: string; days?: number } = {}
    ): Promise<import('./types/shopAdmin').ActivitiesResponse> =>
      shopAdminApi.get('/dashboard/activities', { params }).then((r) => r.data),
    getGrowth: (
      period: import('./types/shopAdmin').GrowthPeriod = 'monthly'
    ): Promise<import('./types/shopAdmin').GrowthResponse> => 
      shopAdminApi.get('/dashboard/growth', { params: { period } }).then((r) => r.data),
  },

  // Staff Management
  staff: {
    getAll: (params: { page?: number; limit?: number; status?: 'ACTIVE' | 'INACTIVE' | 'ALL' } = {}) =>
      shopAdminApi.get('/staff', { params }).then((r) => r.data),
    getById: (staffId: number) => shopAdminApi.get(`/staff/${staffId}`).then((r) => r.data),
    getActivities: (staffId: number, startDate?: string, endDate?: string) =>
      shopAdminApi.get('/staff/activities', {
        params: { 
          staffId, 
          startDate: startDate || '2025-09-01', 
          endDate: endDate || '2025-09-30' 
        }
      }).then((r) => r.data),
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
    }) => shopAdminApi.post('/doctors/add', data).then((r) => r.data),
    getAll: () => shopAdminApi.get('/doctors').then((r) => r.data),
    updateStatus: (doctorId: number, isActive: boolean) =>
      shopAdminApi.put(`/doctors/${doctorId}/status`, { isActive }).then((r) => r.data),
  },

  // Reports
  reports: {
    getSales: (period: string = 'monthly') => 
      shopAdminApi.get('/reports/sales', { params: { period } }).then((r) => r.data),
    getProductSales: (startDate: string, endDate: string, productId?: number) =>
      shopAdminApi.get('/reports/sales/products', { params: { startDate, endDate, productId } }).then((r) => r.data),
    getStaffSales: (startDate: string, endDate: string) =>
      shopAdminApi.get('/reports/sales/staff', { params: { startDate, endDate } }).then((r) => r.data),
    getPatients: (type: string = 'active', startDate: string, endDate: string) =>
      shopAdminApi.get('/reports/patients', { params: { type, startDate, endDate } }).then((r) => r.data),
    getPatientVisits: (patientId: number, startDate: string, endDate: string) =>
      shopAdminApi.get('/reports/patients/visits', { params: { patientId, startDate, endDate } }).then((r) => r.data),
    getInventory: (type: string = 'all', startDate: string, endDate: string) =>
      shopAdminApi.get('/reports/inventory', { params: { type, startDate, endDate } }).then((r) => r.data),
    getInventoryAlerts: () => shopAdminApi.get('/reports/inventory/alerts').then((r) => r.data),
    getInventoryStatus: () =>
      shopAdminApi.get('/reports/inventory/status').then((r) => r.data),
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
    }) => shopAdminApi.post('/inventory/stock-in', data).then((r) => r.data),

    // POST /shop-admin/inventory/adjust
    adjust: (data: {
      productId?: number;
      barcode?: string;
      type: 'ADD' | 'REMOVE';
      quantity: number;
      reason?: string;
      notes?: string;
    }) => shopAdminApi.post('/inventory/adjust', data).then((r) => r.data),

    // GET /shop-admin/inventory/status
    getStatus: (params: {
      page?: number;
      limit?: number;
      lowStock?: boolean;
      sortBy?: 'name' | 'stock' | 'updatedAt' | string;
      sortOrder?: 'asc' | 'desc';
      search?: string;
    } = {}) => shopAdminApi.get('/inventory/status', { params }).then((r) => r.data),
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