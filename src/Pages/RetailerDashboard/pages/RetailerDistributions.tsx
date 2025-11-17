import { useEffect, useRef, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RetailerAPI } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { TablePagination } from "@/components/ui/table-pagination";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { DateRangeFilter } from "@/components/ui/date-range-filter";
import { useQuerySync } from "@/hooks/useQuerySync";

// Type definitions for the new distribution structure
type Distribution = {
  id: number;
  retailerId: number;
  retailerShopId: number;
  retailerProductId: number;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  distributionDate: string;
  deliveryStatus:
    | "PENDING"
    | "SHIPPED"
    | "IN_TRANSIT"
    | "DELIVERED"
    | "RETURNED"
    | "CANCELLED";
  deliveryDate: string | null;
  trackingNumber: string | null;
  paymentStatus: "PENDING" | "PAID" | "OVERDUE" | "PARTIAL";
  paymentDueDate: string | null;
  paidDate: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  retailerProduct: {
    id: number;
    retailerId: number;
    productId: number;
    wholesalePrice: number;
    mrp: number;
    minSellingPrice: number | null;
    totalStock: number;
    allocatedStock: number;
    availableStock: number;
    reorderLevel: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    product: {
      id: number;
      name: string;
      description: string;
      basePrice: number;
      barcode: string;
      sku: string;
      eyewearType: string;
      frameType: string;
      companyId: number;
      material: string;
      color: string;
      size: string;
      model: string;
      createdAt: string;
      updatedAt: string;
      company: {
        id: number;
        name: string;
        description: string;
        createdAt: string;
        updatedAt: string;
      };
    };
  };
  retailerShop: {
    id: number;
    retailerId: number;
    shopId: number;
    partnershipType: string;
    commissionRate: number;
    creditLimit: number;
    paymentTerms: string;
    isActive: boolean;
    joinedAt: string;
    createdAt: string;
    updatedAt: string;
    shop: {
      id: number;
      name: string;
      address: string;
      phone: string;
      email: string;
      licenseNo: string | null;
      gstNo: string | null;
      createdAt: string;
      updatedAt: string;
      lowStockThreshold: number;
      currency: string;
      timezone: string;
    };
  };
};

export default function RetailerDistributions() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [statusMsg, setStatusMsg] = useState("Loading distributions…");

  const [list, setList] = useState<{
    distributions: Distribution[];
    pagination?: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    } | null;
  }>({ distributions: [], pagination: null });

  const [filters, setFilters] = useState<{
    shopId?: string;
    deliveryStatus?: string;
    paymentStatus?: string;
    dateFrom?: string;
    dateTo?: string;
  }>({});
  const [page, setPage] = useState(1);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailDistribution, setDetailDistribution] =
    useState<Distribution | null>(null);

  const openDetail = async (dist: Distribution) => {
    setDetailDistribution(dist);
    setDetailOpen(true);
  };

  const fetchData = async (p = page) => {
    try {
      setLoading(true);
      setStatusMsg("Loading distributions…");
      const baseParams: Record<string, unknown> = {
        page: p,
        limit: 20,
        retailerShopId: filters.shopId ? Number(filters.shopId) : undefined,
        status: filters.deliveryStatus || undefined,
        startDate: filters.dateFrom || undefined,
        endDate: filters.dateTo || undefined,
      };
      if (filters.paymentStatus)
        baseParams.paymentStatus = filters.paymentStatus;

      console.log("Fetching distributions with params:", baseParams);
      const data = await RetailerAPI.distributions.getAll(baseParams);
      console.log("Distributions response:", data);
      setList((data as unknown as typeof list) || { distributions: [] });
      setPage(p);
      setStatusMsg("Distributions loaded");
    } catch (e) {
      console.error("Error fetching distributions:", e);
      const message =
        typeof e === "object" && e && "message" in e
          ? String((e as { message?: unknown }).message)
          : undefined;
      setError(message || "Failed to load distributions");
      setStatusMsg("Error loading distributions");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchRef = useRef(fetchData);
  useEffect(() => {
    fetchRef.current = fetchData;
  });

  // Initial load on mount
  useEffect(() => {
    fetchRef.current(1);
  }, []);

  // Use shared query sync hook
  const filterKeysRef = useRef(JSON.stringify(filters));
  useQuerySync<{
    shopId?: string;
    deliveryStatus?: string;
    paymentStatus?: string;
    dateFrom?: string;
    dateTo?: string;
  }>({
    state: filters,
    setState: (updater) => setFilters(updater(filters)),
    keys: ["shopId", "deliveryStatus", "paymentStatus", "dateFrom", "dateTo"],
    onExternalChange: () => {
      /* external change triggers fetch in effect below */
    },
  });

  // Fetch on filter change
  useEffect(() => {
    const newKeys = JSON.stringify(filters);
    if (newKeys !== filterKeysRef.current) {
      filterKeysRef.current = newKeys;
      fetchRef.current(1);
    }
  }, [filters]);

  // Calculate summary from distributions
  const summary = useMemo(() => {
    const totals = list.distributions.reduce(
      (acc, d) => {
        acc.totalDistributions += 1;
        acc.totalAmount += d.totalAmount || 0;
        if (d.deliveryStatus && d.deliveryStatus !== "DELIVERED")
          acc.pendingDeliveries += 1;
        if (d.paymentStatus && d.paymentStatus !== "PAID")
          acc.pendingPayments += 1;
        return acc;
      },
      {
        totalDistributions: 0,
        totalAmount: 0,
        pendingDeliveries: 0,
        pendingPayments: 0,
      }
    );
    return totals;
  }, [list.distributions]);

  // Graph data: Delivery Status breakdown
  const deliveryStatusData = useMemo(() => {
    const counts: Record<string, number> = {};
    list.distributions.forEach((d) => {
      const status = d.deliveryStatus || "UNKNOWN";
      counts[status] = (counts[status] || 0) + 1;
    });
    return Object.entries(counts).map(([status, count]) => ({
      status,
      count,
      percentage: Math.round((count / list.distributions.length) * 100) || 0,
    }));
  }, [list.distributions]);

  // Graph data: Payment Status breakdown
  const paymentStatusData = useMemo(() => {
    const counts: Record<string, number> = {};
    list.distributions.forEach((d) => {
      const status = d.paymentStatus || "UNKNOWN";
      counts[status] = (counts[status] || 0) + 1;
    });
    return Object.entries(counts).map(([status, count]) => ({
      status,
      count,
      percentage: Math.round((count / list.distributions.length) * 100) || 0,
    }));
  }, [list.distributions]);

  // Graph data: Top Shops by Distribution Amount
  const topShopsData = useMemo(() => {
    const shopTotals: Record<
      string,
      { name: string; amount: number; count: number }
    > = {};
    list.distributions.forEach((d) => {
      const shopKey = String(d.retailerShop.shop.id);
      if (!shopTotals[shopKey]) {
        shopTotals[shopKey] = {
          name: d.retailerShop.shop.name,
          amount: 0,
          count: 0,
        };
      }
      shopTotals[shopKey].amount += d.totalAmount;
      shopTotals[shopKey].count += 1;
    });
    return Object.values(shopTotals)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [list.distributions]);

  // Graph data: Top Products by Distribution Quantity
  const topProductsData = useMemo(() => {
    const prodTotals: Record<
      string,
      { name: string; quantity: number; amount: number }
    > = {};
    list.distributions.forEach((d) => {
      const prodKey = String(d.retailerProduct.product.id);
      if (!prodTotals[prodKey]) {
        prodTotals[prodKey] = {
          name: d.retailerProduct.product.name,
          quantity: 0,
          amount: 0,
        };
      }
      prodTotals[prodKey].quantity += d.quantity;
      prodTotals[prodKey].amount += d.totalAmount;
    });
    return Object.values(prodTotals)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  }, [list.distributions]);

  const skeletonTable = (
    <div className="overflow-x-auto border rounded-md">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-muted-foreground">
            {[
              "Shop",
              "Product",
              "Qty",
              "Amount",
              "Delivery",
              "Payment",
              "Payment Due",
            ].map((h) => (
              <th key={h} className="py-2 px-3">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 8 }).map((_, i) => (
            <tr key={i} className="border-t">
              <td className="py-2 px-3">
                <Skeleton className="h-4 w-28" />
              </td>
              <td className="py-2 px-3">
                <Skeleton className="h-4 w-40" />
              </td>
              <td className="py-2 px-3">
                <Skeleton className="h-4 w-10" />
              </td>
              <td className="py-2 px-3">
                <Skeleton className="h-4 w-16" />
              </td>
              <td className="py-2 px-3">
                <Skeleton className="h-4 w-20" />
              </td>
              <td className="py-2 px-3">
                <Skeleton className="h-4 w-24" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-brand-gradient">
          Distributions
        </h2>
        <p className="text-muted-foreground">
          Real-time distributions, analytics & status tracking
        </p>
      </div>

      {/* Summary Cards */}
      <div
        className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs w-full"
        aria-live="polite"
      >
        <div className="p-2 rounded-md bg-muted/40 border">
          <div className="text-muted-foreground">Distributions</div>
          <div className="font-medium text-lg">
            {formatNumber(summary.totalDistributions)}
          </div>
        </div>
        <div className="p-2 rounded-md bg-muted/40 border">
          <div className="text-muted-foreground">Total Amount</div>
          <div className="font-medium text-lg">
            {formatCurrency(summary.totalAmount)}
          </div>
        </div>
        <div className="p-2 rounded-md bg-yellow-50 dark:bg-yellow-900/20 border">
          <div className="text-yellow-700 dark:text-yellow-300 font-medium">
            Pending Deliveries
          </div>
          <div className="font-semibold text-lg text-yellow-600 dark:text-yellow-400">
            {formatNumber(summary.pendingDeliveries)}
          </div>
        </div>
        <div className="p-2 rounded-md bg-orange-50 dark:bg-orange-900/20 border">
          <div className="text-orange-700 dark:text-orange-300 font-medium">
            Pending Payments
          </div>
          <div className="font-semibold text-lg text-orange-600 dark:text-orange-400">
            {formatNumber(summary.pendingPayments)}
          </div>
        </div>
      </div>

      {/* Graph Cards */}
      {list.distributions.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Delivery Status Chart */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-sm text-brand-gradient">
                Delivery Status Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {deliveryStatusData.map((item) => (
                  <div key={item.status} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">
                        {item.status}
                      </span>
                      <span className="font-medium">{item.count}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Payment Status Chart */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-sm text-brand-gradient">
                Payment Status Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {paymentStatusData.map((item) => (
                  <div key={item.status} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">
                        {item.status}
                      </span>
                      <span className="font-medium">{item.count}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          item.status === "PAID"
                            ? "bg-gradient-to-r from-green-500 to-green-600"
                            : "bg-gradient-to-r from-red-500 to-red-600"
                        }`}
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Shops */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-sm text-brand-gradient">
                Top Shops by Amount
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {topShopsData.map((shop, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded bg-muted/30"
                  >
                    <div className="flex-1">
                      <div className="text-xs font-medium">{shop.name}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {shop.count} distributions
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold">
                        {formatCurrency(shop.amount)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Products */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-sm text-brand-gradient">
                Top Products by Quantity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {topProductsData.map((product, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded bg-muted/30"
                  >
                    <div className="flex-1">
                      <div className="text-xs font-medium">{product.name}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {formatCurrency(product.amount)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold">
                        {formatNumber(product.quantity)} units
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={refreshing || loading}
          onClick={() => {
            setRefreshing(true);
            fetchData(1);
          }}
        >
          {refreshing ? "Refreshing…" : "Refresh"}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="text-sm">
          <AlertDescription>
            {error}{" "}
            <Button
              size="sm"
              variant="outline"
              className="ml-2"
              onClick={() => fetchData(page)}
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Distributions Table */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-brand-gradient">
            Distributions List
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center mb-4 flex-wrap">
            <input
              className="border rounded-md p-2 text-sm flex-1 min-w-[150px]"
              placeholder="Filter by shop ID"
              value={filters.shopId || ""}
              onChange={(e) =>
                setFilters((f) => ({ ...f, shopId: e.target.value }))
              }
            />
            <select
              className="border rounded-md p-2 text-sm"
              value={filters.deliveryStatus || ""}
              onChange={(e) =>
                setFilters((f) => ({ ...f, deliveryStatus: e.target.value }))
              }
            >
              <option value="">Delivery: Any</option>
              {[
                "PENDING",
                "SHIPPED",
                "IN_TRANSIT",
                "DELIVERED",
                "RETURNED",
                "CANCELLED",
              ].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <select
              className="border rounded-md p-2 text-sm"
              value={filters.paymentStatus || ""}
              onChange={(e) =>
                setFilters((f) => ({ ...f, paymentStatus: e.target.value }))
              }
            >
              <option value="">Payment: Any</option>
              {["PENDING", "PAID", "OVERDUE", "PARTIAL"].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <DateRangeFilter
              value={{ start: filters.dateFrom, end: filters.dateTo }}
              onChange={(r) =>
                setFilters((f) => ({ ...f, dateFrom: r.start, dateTo: r.end }))
              }
            />
            <Button size="sm" variant="ghost" onClick={() => setFilters({})}>
              Reset
            </Button>
          </div>

          {/* Active filter badges */}
          <div className="flex gap-2 flex-wrap mb-3">
            {Object.entries(filters)
              .filter(([, v]) => v)
              .map(([k, v]) => (
                <div
                  key={k}
                  className="text-[10px] px-2 py-1 bg-muted rounded-md flex items-center gap-1"
                >
                  <span>
                    {k}:{v}
                  </span>
                  <button
                    className="text-xs"
                    onClick={() => {
                      setFilters((f) => {
                        const clone = { ...f } as Record<string, unknown>;
                        delete clone[k];
                        return clone as typeof filters;
                      });
                      fetchData(1);
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
          </div>

          <div aria-live="polite" className="sr-only">
            {statusMsg}
          </div>

          {loading ? (
            skeletonTable
          ) : (
            <div className="overflow-x-auto border rounded-md">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground">
                    <th className="py-2 px-3">Shop</th>
                    <th className="py-2 px-3">Product</th>
                    <th className="py-2 px-3">Qty</th>
                    <th className="py-2 px-3">Unit Price</th>
                    <th className="py-2 px-3">Amount</th>
                    <th className="py-2 px-3">Delivery</th>
                    <th className="py-2 px-3">Payment</th>
                    <th className="py-2 px-3">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {(list?.distributions ?? []).length ? (
                    list.distributions.map((d) => (
                      <tr
                        key={d.id}
                        className="border-t hover:bg-muted/30 cursor-pointer"
                        onClick={() => openDetail(d)}
                      >
                        <td className="py-2 px-3 text-xs">
                          {d.retailerShop.shop.name}
                        </td>
                        <td className="py-2 px-3 text-xs">
                          {d.retailerProduct.product.name}
                        </td>
                        <td className="py-2 px-3 text-xs">
                          {formatNumber(d.quantity)}
                        </td>
                        <td className="py-2 px-3 text-xs">
                          {formatCurrency(d.unitPrice)}
                        </td>
                        <td className="py-2 px-3 text-xs font-medium">
                          {formatCurrency(d.totalAmount)}
                        </td>
                        <td className="py-2 px-3">
                          <StatusBadge status={d.deliveryStatus} />
                        </td>
                        <td className="py-2 px-3">
                          <StatusBadge status={d.paymentStatus} />
                        </td>
                        <td className="py-2 px-3 text-xs">
                          {new Date(d.createdAt).toLocaleDateString(undefined, {
                            year: "2-digit",
                            month: "short",
                            day: "numeric",
                          })}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={8}
                        className="py-4 text-center text-xs text-muted-foreground"
                      >
                        No distributions match current filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {list.pagination && (
            <TablePagination
              page={list.pagination.page}
              totalPages={list.pagination.pages}
              totalItems={list.pagination.total}
              onPrev={() => fetchData(list.pagination!.page - 1)}
              onNext={() => fetchData(list.pagination!.page + 1)}
              disablePrev={list.pagination.page <= 1}
              disableNext={list.pagination.page >= list.pagination.pages}
              label="Distributions pagination"
              className="mt-4"
            />
          )}
        </CardContent>
      </Card>

      {/* Distribution Detail Sheet */}
      <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
        <SheetContent
          side="right"
          className="sm:max-w-2xl w-full overflow-y-auto"
        >
          <SheetHeader>
            <SheetTitle>Distribution #{detailDistribution?.id}</SheetTitle>
            <SheetDescription>
              {detailDistribution?.retailerShop.shop.name}
            </SheetDescription>
          </SheetHeader>
          {detailDistribution && (
            <div className="mt-6 space-y-6">
              {/* Shop & Product Info */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-muted/30">
                  <div className="text-[10px] uppercase text-muted-foreground font-semibold">
                    Shop
                  </div>
                  <div className="font-medium text-sm mt-1">
                    {detailDistribution.retailerShop.shop.name}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {detailDistribution.retailerShop.shop.address}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-muted/30">
                  <div className="text-[10px] uppercase text-muted-foreground font-semibold">
                    Product
                  </div>
                  <div className="font-medium text-sm mt-1">
                    {detailDistribution.retailerProduct.product.name}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    SKU: {detailDistribution.retailerProduct.product.sku}
                  </div>
                </div>
              </div>

              {/* Distribution Details */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                  <div className="text-[10px] uppercase text-blue-700 dark:text-blue-300 font-semibold">
                    Quantity
                  </div>
                  <div className="font-semibold text-lg mt-1 text-blue-700 dark:text-blue-300">
                    {detailDistribution.quantity}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
                  <div className="text-[10px] uppercase text-green-700 dark:text-green-300 font-semibold">
                    Unit Price
                  </div>
                  <div className="font-semibold text-lg mt-1 text-green-700 dark:text-green-300">
                    {formatCurrency(detailDistribution.unitPrice)}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20 col-span-2">
                  <div className="text-[10px] uppercase text-purple-700 dark:text-purple-300 font-semibold">
                    Total Amount
                  </div>
                  <div className="font-semibold text-2xl mt-1 text-purple-700 dark:text-purple-300">
                    {formatCurrency(detailDistribution.totalAmount)}
                  </div>
                </div>
              </div>

              {/* Status Information */}
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-muted/30">
                  <div className="text-[10px] uppercase text-muted-foreground font-semibold mb-2">
                    Delivery Status
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={detailDistribution.deliveryStatus} />
                    <span className="text-xs text-muted-foreground">
                      {detailDistribution.deliveryDate
                        ? `Delivered: ${new Date(
                            detailDistribution.deliveryDate
                          ).toLocaleDateString()}`
                        : "Not yet delivered"}
                    </span>
                  </div>
                  {detailDistribution.trackingNumber && (
                    <div className="text-xs text-muted-foreground mt-2">
                      Tracking: {detailDistribution.trackingNumber}
                    </div>
                  )}
                </div>

                <div className="p-3 rounded-lg bg-muted/30">
                  <div className="text-[10px] uppercase text-muted-foreground font-semibold mb-2">
                    Payment Status
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={detailDistribution.paymentStatus} />
                    {detailDistribution.paymentDueDate && (
                      <span className="text-xs text-muted-foreground">
                        Due:{" "}
                        {new Date(
                          detailDistribution.paymentDueDate
                        ).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  {detailDistribution.paidDate && (
                    <div className="text-xs text-green-600 dark:text-green-400 mt-2">
                      Paid:{" "}
                      {new Date(
                        detailDistribution.paidDate
                      ).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>

              {/* Dates */}
              <div className="space-y-2 text-xs text-muted-foreground">
                <div>
                  Distribution Date:{" "}
                  <span className="font-medium">
                    {new Date(
                      detailDistribution.distributionDate
                    ).toLocaleString()}
                  </span>
                </div>
                <div>
                  Created:{" "}
                  <span className="font-medium">
                    {new Date(detailDistribution.createdAt).toLocaleString()}
                  </span>
                </div>
                <div>
                  Updated:{" "}
                  <span className="font-medium">
                    {new Date(detailDistribution.updatedAt).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Notes */}
              {detailDistribution.notes && (
                <div className="p-3 rounded-lg bg-muted/30">
                  <div className="text-[10px] uppercase text-muted-foreground font-semibold mb-2">
                    Notes
                  </div>
                  <p className="text-sm whitespace-pre-wrap">
                    {detailDistribution.notes}
                  </p>
                </div>
              )}

              {/* Shop Details */}
              <div className="p-3 rounded-lg bg-muted/30">
                <div className="text-[10px] uppercase text-muted-foreground font-semibold mb-2">
                  Shop Details
                </div>
                <div className="space-y-1 text-xs">
                  <div>Phone: {detailDistribution.retailerShop.shop.phone}</div>
                  <div>Email: {detailDistribution.retailerShop.shop.email}</div>
                  {detailDistribution.retailerShop.shop.gstNo && (
                    <div>
                      GST No: {detailDistribution.retailerShop.shop.gstNo}
                    </div>
                  )}
                  <div className="mt-2">
                    <span className="text-muted-foreground">Partnership:</span>{" "}
                    {detailDistribution.retailerShop.partnershipType}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Commission:</span>{" "}
                    {detailDistribution.retailerShop.commissionRate}%
                  </div>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
