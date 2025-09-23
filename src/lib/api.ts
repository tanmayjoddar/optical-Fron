import axios from 'axios';
import { store } from '../store';
import { logout } from '../store/authSlice';

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: 'https://staff-production-c6d9.up.railway.app',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add JWT token
apiClient.interceptors.request.use(
  (config) => {
    const state = store.getState();
    const token = state.auth.token;
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle authentication errors
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
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

// API endpoint functions
export const api = {
  // Patient endpoints
  patients: {
    getAll: (shopId?: number) => {
      const params = shopId ? { shopId } : {};
      return apiClient.get('/api/patient', { params });
    },
    getById: (id: number, shopId?: number) => {
      const params = shopId ? { shopId } : {};
      return apiClient.get(`/api/patient/${id}`, { params });
    },
    create: (data: {
      name: string;
      age: number;
      gender: string;
      phone: string;
      address: string;
      medicalHistory?: string;
      shopId: number;
    }) => apiClient.post('/api/patient', data),
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

  // Customer endpoints
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

  // Inventory endpoints
  inventory: {
    getAll: (params?: {
      eyewearType?: string;
      companyId?: number;
      frameType?: string;
    }) => apiClient.get('/api/inventory', { params }),
    updateStockByBarcode: (data: {
      barcode: string;
      quantity: number;
      price?: number;
      shopId: number;
    }) => apiClient.post('/api/inventory/stock-by-barcode', data),
    addProduct: (data: {
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
    }) => apiClient.post('/api/inventory/product', data),
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
    stockOutByBarcode: (data: {
      barcode: string;
      quantity: number;
    }) => apiClient.post('/api/inventory/stock-out-by-barcode', data),
    getProductByBarcode: (barcode: string) => 
      apiClient.get(`/api/inventory/product/barcode/${barcode}`),
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

  // Invoice endpoints
  invoices: {
    getAll: () => apiClient.get('/api/invoice'),
    getById: (id: number) => apiClient.get(`/api/invoice/${id}`),
    create: (data: {
      customerId: number;
      items: Array<{
        productId: number;
        quantity: number;
        unitPrice: number;
        discount?: number;
        taxRate?: number;
      }>;
      subtotal: number;
      totalAmount: number;
      cgst?: number;
      sgst?: number;
      notes?: string;
      shopId?: number;
      paymentMethod?: string;
    }) => apiClient.post('/api/invoice', data),
    updateStatus: (id: number, status: string) => 
      apiClient.patch(`/api/invoice/${id}/status`, { status }),
    addPayment: (
      id: number,
      data: {
        amount: number;
        method: 'CASH' | 'CARD' | 'UPI' | 'BANK_TRANSFER' | string;
        reference?: string;
        date?: string;
        notes?: string;
      }
    ) => apiClient.post(`/api/invoice/${id}/payment`, data),
    delete: (id: number) => apiClient.delete(`/api/invoice/${id}`),
    getPdf: (id: number) => apiClient.get(`/api/invoice/${id}/pdf`),
  },

  // Prescription endpoints
  prescriptions: {
    getAll: () => apiClient.get('/api/prescription'),
    getById: (id: number) => apiClient.get(`/api/prescription/${id}`),
    create: (data: {
      patientId: number;
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
    }) => apiClient.post('/api/prescription', data),
    getPdf: (id: number) => apiClient.get(`/api/prescription/${id}/pdf`),
    getThermal: (id: number) => apiClient.get(`/api/prescription/${id}/thermal`),
  },
};

export default apiClient;