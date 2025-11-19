// Centralized TypeScript types for Shop Admin endpoints

// DASHBOARD METRICS
export interface ShopAdminMetrics {
  today: {
    sales: number;
    orders: number;
    patients: number;
    staff: number;
  };
  monthly: {
    sales: number;
    orders: number;
    salesGrowth: number; // percentage +/-
    orderGrowth: number; // percentage +/-
  };
  inventory: {
    totalProducts: number;
    lowStockAlerts: number;
  };
  cached?: boolean;
  // Allow the backend to add extra fields without breaking the UI
  [key: string]: unknown;
}

// DASHBOARD GROWTH
export type GrowthPeriod = "daily" | "weekly" | "monthly" | "yearly";

export interface GrowthItem {
  // Label for the period item (e.g., '2025-09-01', 'Week 38', 'Sep 2025', '2025')
  period: string;
  sales: number;
  orders: number;
  patients: number;
}

// Some backends may return an array, some an object keyed by index/date
export type GrowthResponse = GrowthItem[] | Record<string, GrowthItem>;

// DASHBOARD ACTIVITIES
export interface ActivityItem {
  type: string; // e.g., 'sales' | 'orders' | 'patients' | 'inventory' | 'alert'
  message: string;
  amount?: number;
  timestamp: string; // ISO string
  [key: string]: unknown;
}

export interface ActivitiesPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export type ActivitiesResponse =
  | ActivityItem[]
  | {
      activities: ActivityItem[];
      pagination?: ActivitiesPagination;
      cached?: boolean;
      [key: string]: unknown;
    };

// INCOMING SHIPMENTS
export interface ShipmentProduct {
  id: number;
  name: string;
  sku: string;
  basePrice: number;
  frameType: string;
  material: string;
  color: string;
  size: string;
  model: string;
  company: {
    id: number;
    name: string;
    description: string;
  };
}

export interface ShipmentStockReceipt {
  id: number;
  receivedQuantity: number;
  verifiedQuantity: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
}

export interface ShipmentRetailer {
  id: number;
  name: string;
  companyName: string | null;
  email: string;
}

export interface ShipmentShop {
  id: number;
  name: string;
  address: string;
}

export interface IncomingShipment {
  id: number;
  product: ShipmentProduct;
  shop: ShipmentShop;
  retailer: ShipmentRetailer;
  expectedQuantity: number;
  receivedQuantity: number;
  discrepancyQuantity: number;
  status:
    | "EXPECTED"
    | "IN_TRANSIT"
    | "PARTIALLY_RECEIVED"
    | "FULLY_RECEIVED"
    | "OVERDUE"
    | "CANCELLED";
  distributionDate: string;
  expectedDeliveryDate: string | null;
  actualDeliveryDate: string | null;
  wholesalePrice: number;
  mrp: number;
  stockReceipt: ShipmentStockReceipt | null;
  discrepancyReason: "SHORTAGE" | "EXCESS" | "DAMAGED" | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface IncomingShipmentsListResponse {
  message: string;
  shipments: IncomingShipment[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPrevious: boolean;
  };
  summary: {
    total: number;
    expected: number;
    inTransit: number;
    partiallyReceived: number;
    fullyReceived: number;
    overdue: number;
    cancelled: number;
  };
}

export interface IncomingShipmentDetailResponse {
  message: string;
  shipment: IncomingShipment;
}

export interface UpdateShipmentStatusRequest {
  status:
    | "EXPECTED"
    | "IN_TRANSIT"
    | "PARTIALLY_RECEIVED"
    | "FULLY_RECEIVED"
    | "OVERDUE"
    | "CANCELLED";
  receivedQuantity?: number;
  discrepancyQuantity?: number;
  discrepancyReason?: "SHORTAGE" | "EXCESS" | "DAMAGED";
  notes?: string;
}

export interface UpdateShipmentStatusResponse {
  message: string;
  shipment: IncomingShipment;
}

export interface IncomingShipmentsParams {
  page?: number;
  limit?: number;
  status?:
    | "EXPECTED"
    | "IN_TRANSIT"
    | "PARTIALLY_RECEIVED"
    | "FULLY_RECEIVED"
    | "OVERDUE"
    | "CANCELLED";
}
