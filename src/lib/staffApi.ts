import axios, { AxiosHeaders, type AxiosRequestHeaders } from "axios";

export const staffApi = axios.create({
  baseURL: "https://staff-production-c6d9.up.railway.app",
  headers: { "Content-Type": "application/json" },
});

staffApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("jwt");
  if (token) {
    const h = config.headers;
    const value = `Bearer ${token}`;
    if (h instanceof AxiosHeaders) {
      h.set("Authorization", value);
      config.headers = h;
    } else if (h && typeof (h as { set?: unknown }).set === "function") {
      // In case a custom headers-like object is used
      (h as unknown as { set: (k: string, v: string) => void }).set("Authorization", value);
      config.headers = h as AxiosRequestHeaders;
    } else {
      const plain = { ...(h as Record<string, unknown>), Authorization: value };
      config.headers = plain as unknown as AxiosRequestHeaders;
    }
  }
  return config;
});

staffApi.interceptors.response.use(
  (res) => res,
  (error) => {
    const message = error?.response?.data?.error || error?.response?.data?.message || error.message || "Request failed";
    return Promise.reject(new Error(message));
  }
);

export const StaffAPI = {
  // Inventory & Barcode
  stockByBarcode: (body: { barcode: string; quantity: number; price: number }) =>
    staffApi.post("/stock-by-barcode", body).then((r) => r.data),
  stockOutByBarcode: (body: { barcode: string; quantity: number }) =>
    staffApi.post("/stock-out-by-barcode", body).then((r) => r.data),
  getProductByBarcode: (barcode: string) => staffApi.get(`/product/barcode/${encodeURIComponent(barcode)}`).then((r) => r.data),
  addProduct: (body: {
    name: string; description?: string; barcode?: string; sku?: string; basePrice: number;
    eyewearType: string; frameType?: string; companyId: number; material?: string; color?: string; size?: string; model?: string;
  }) => staffApi.post('/product', body).then((r) => r.data),
  getInventory: () => staffApi.get('/').then((r) => r.data),

  // Invoices
  createInvoice: (body: {
    patientId?: number; customerId?: number; items: Array<{ productId: number; quantity: number; discount?: number; cgst?: number; sgst?: number }>; totalIgst?: number;
  }) => staffApi.post('/invoices', body).then((r) => r.data),
  getInvoice: (id: number) => staffApi.get(`/invoices/${id}`).then((r) => r.data),
  updateInvoiceStatus: (id: number, status: 'PAID' | 'UNPAID' | 'PARTIALLY_PAID' | string) =>
    staffApi.patch(`/invoices/${id}/status`, { status }).then((r) => r.data),
  addInvoicePayment: (id: number, body: { amount: number; paymentMethod: 'CASH' | 'UPI' | 'CARD' | 'GIFT_CARD'; giftCardCode?: string }) =>
    staffApi.post(`/invoices/${id}/payment`, body).then((r) => r.data),
  cancelInvoice: (id: number) => staffApi.delete(`/invoices/${id}`).then((r) => r.data),

  // Patients
  createPatient: (body: { name: string; age?: number; gender?: string; phone?: string; address?: string; medicalHistory?: string }) =>
    staffApi.post('/patients', body).then((r) => r.data),
  listPatients: (params: { page?: number; limit?: number; search?: string } = {}) =>
    staffApi.get('/patients', { params }).then((r) => r.data),
  getPatient: (id: number) => staffApi.get(`/patients/${id}`).then((r) => r.data),

  // Prescriptions
  createPrescription: (body: {
    patientId: number;
    rightEye: { sph?: string; cyl?: string; axis?: string; add?: string };
    leftEye: { sph?: string; cyl?: string; axis?: string; add?: string };
  }) => staffApi.post('/prescriptions', body).then((r) => r.data),
  listPrescriptions: (params: { page?: number; limit?: number; patientId?: number } = {}) =>
    staffApi.get('/prescriptions', { params }).then((r) => r.data),
  getPrescription: (id: number) => staffApi.get(`/prescriptions/${id}`).then((r) => r.data),
  getPrescriptionPdf: (id: number) => staffApi.get(`/prescriptions/${id}/pdf`, { responseType: 'blob' }).then((r) => r.data as Blob),
  getPrescriptionThermal: (id: number) => staffApi.get(`/prescriptions/${id}/thermal`, { responseType: 'text' }).then((r) => r.data as string),

  // Reports
  dailyReport: (date: string) => staffApi.get('/reports/daily', { params: { date } }).then((r) => r.data),
  monthlyReport: (year: number, month: number) => staffApi.get('/reports/monthly', { params: { year, month } }).then((r) => r.data),
  staffSalesReport: (startDate: string, endDate: string) => staffApi.get('/reports/staff-sales', { params: { startDate, endDate } }).then((r) => r.data),
  salesByPriceTier: (startDate: string, endDate: string) => staffApi.get('/reports/sales-by-price-tier', { params: { startDate, endDate } }).then((r) => r.data),
  bestSellersByPriceTier: (startDate: string, endDate: string, limit?: number) => staffApi.get('/reports/best-sellers-by-price-tier', { params: { startDate, endDate, limit } }).then((r) => r.data),

  // Royalty
  addRoyaltyPoints: (patientId: number) => staffApi.post('/royalty', { patientId }).then((r) => r.data),
  getRoyaltyPoints: (patientId: number) => staffApi.get(`/royalty/${patientId}`).then((r) => r.data),

  // Stock Receipts (note /api prefix)
  createStockReceipt: (body: { productId: number; receivedQuantity: number; supplierName?: string; deliveryNote?: string; batchNumber?: string; expiryDate?: string }) =>
    staffApi.post('/api/stock-receipts', body).then((r) => r.data),
  listStockReceipts: (params: { status?: string } = {}) => staffApi.get('/api/stock-receipts', { params }).then((r) => r.data),
  getStockReceipt: (id: number) => staffApi.get(`/api/stock-receipts/${id}`).then((r) => r.data),

  // Gift Cards (note /api prefix)
  issueGiftCard: (patientId: number, balance: number) => staffApi.post('/api/gift-cards/issue', { patientId, balance }).then((r) => r.data),
  redeemGiftCard: (code: string, amount: number) => staffApi.post('/api/gift-cards/redeem', { code, amount }).then((r) => r.data),
  giftCardBalance: (code: string) => staffApi.get(`/api/gift-cards/${code}`).then((r) => r.data),
};

export type StaffApiError = Error & { status?: number };
