import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RetailerAPI } from "@/lib/api";
import type { InventoryAnalyticsResponse } from "@/lib/types/retailer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatNumber } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export default function RetailerInventory() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  type TopCompany = {
    company?: { name?: string } | null;
    productCount?: number;
    totalQuantity?: number;
    stockValue?: number;
  };
  // Adapted Summary: prioritize documented spec (endpoint 25) fields and allow extended fields gracefully.
  // Spec fields: totalProducts, totalStockValue, lowStockProducts, outOfStockProducts, categories{...}
  // Extended (optional) fields from backend (not in docs): totalQuantity, availableStock, allocatedStock, topCompanies, recentTransactions
  type Summary = {
    // Spec
    totalProducts?: number;
    totalStockValue?: number;
    lowStockProducts?: number;
    outOfStockProducts?: number;
    categories?: Record<string, { count: number; value: number }>;
    // Extended
    totalQuantity?: number;
    availableStock?: number;
    allocatedStock?: number;
    topCompanies?: TopCompany[];
    recentTransactions?: Array<{
      id: number;
      type?: string;
      product?: { name?: string } | null;
      quantity?: number;
      createdAt: string;
    }>;
  };
  const [summary, setSummary] = useState<Summary | null>(null);
  const [analytics, setAnalytics] = useState<InventoryAnalyticsResponse | null>(
    null
  );

  const refreshSummary = useRef<() => Promise<void>>(async () => {});
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const [s, a] = await Promise.all([
          RetailerAPI.inventory.summary(),
          RetailerAPI.dashboard.inventoryAnalytics(),
        ]);
        if (!mounted) return;
        setSummary(s);
        setAnalytics(a);
      } catch (e) {
        const message =
          typeof e === "object" && e && "message" in e
            ? String((e as { message?: unknown }).message)
            : undefined;
        setError(message || "Failed to load inventory summary");
      } finally {
        setLoading(false);
      }
    };
    refreshSummary.current = load;
    load();
    return () => {
      mounted = false;
    };
  }, []);

  // Optimistic summary adjustment when a distribution is created (Task 38)
  useEffect(() => {
    const handler = (e: Event) => {
      const detail: any = (e as CustomEvent).detail;
      if (!detail || !Array.isArray(detail.lines)) return;
      const addedQty = detail.lines.reduce(
        (a: number, l: any) => a + (l.quantity || 0),
        0
      );
      if (addedQty <= 0) return;
      setSummary((prev) => {
        if (!prev) return prev;
        const available =
          prev.availableStock != null
            ? Math.max(0, (prev.availableStock || 0) - addedQty)
            : prev.availableStock;
        const allocated =
          prev.allocatedStock != null
            ? (prev.allocatedStock || 0) + addedQty
            : prev.allocatedStock;
        const totalQuantity =
          prev.totalQuantity != null ? prev.totalQuantity || 0 : undefined;
        return {
          ...prev,
          availableStock: available,
          allocatedStock: allocated,
          // Maintain totalQuantity invariant if both available+allocated known but totalQuantity missing
          totalQuantity:
            totalQuantity !== undefined
              ? totalQuantity
              : available != null && allocated != null
              ? available + allocated
              : totalQuantity,
        };
      });
      // Gentle background refresh after short delay to reconcile with authoritative backend
      setTimeout(() => {
        try {
          refreshSummary.current?.();
        } catch {
          /* ignore */
        }
      }, 1200);
    };
    window.addEventListener("retailer:distribution-created", handler as any);
    return () =>
      window.removeEventListener(
        "retailer:distribution-created",
        handler as any
      );
  }, []);

  if (loading) {
    return (
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card className="glass-card" key={i}>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                <Skeleton className="h-4 w-28" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-4 w-32 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-brand-gradient">
          Inventory
        </h2>
        <p className="text-muted-foreground">Summary & stock distribution</p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-sm">Total Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(summary?.totalProducts)}
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-sm">Stock Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(summary?.totalStockValue)}
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-sm">Low Stock Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {formatNumber(summary?.lowStockProducts)}
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-sm">Out of Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatNumber(summary?.outOfStockProducts)}
            </div>
          </CardContent>
        </Card>
      </div>

      {(summary?.availableStock !== undefined ||
        summary?.allocatedStock !== undefined ||
        summary?.totalQuantity !== undefined) && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {summary?.totalQuantity !== undefined && (
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-sm">Total Quantity (ext)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-semibold">
                  {formatNumber(summary.totalQuantity)}
                </div>
              </CardContent>
            </Card>
          )}
          {summary?.availableStock !== undefined && (
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-sm">Available (ext)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-semibold">
                  {formatNumber(summary.availableStock)}
                </div>
              </CardContent>
            </Card>
          )}
          {summary?.allocatedStock !== undefined && (
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-sm">Allocated (ext)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-semibold">
                  {formatNumber(summary.allocatedStock)}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {summary?.categories && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-brand-gradient">
              Category Breakdown (Spec)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground">
                    <th className="py-2 pr-4">Category</th>
                    <th className="py-2 pr-4">Count</th>
                    <th className="py-2 pr-4">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(summary.categories).map(([cat, v]) => (
                    <tr key={cat} className="border-t">
                      <td className="py-2 pr-4">{cat}</td>
                      <td className="py-2 pr-4">{v.count}</td>
                      <td className="py-2 pr-4">
                        ₹{v.value.toLocaleString?.()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {(summary?.topCompanies?.length || 0) > 0 && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-brand-gradient">
              Top Companies (Extended)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground">
                    <th className="py-2 pr-4">Company</th>
                    <th className="py-2 pr-4">Products</th>
                    <th className="py-2 pr-4">Quantity</th>
                    <th className="py-2 pr-4">Stock Value</th>
                  </tr>
                </thead>
                <tbody>
                  {(summary?.topCompanies ?? []).map(
                    (c: TopCompany, idx: number) => (
                      <tr key={idx} className="border-t">
                        <td className="py-2 pr-4">{c.company?.name}</td>
                        <td className="py-2 pr-4">{c.productCount}</td>
                        <td className="py-2 pr-4">{c.totalQuantity}</td>
                        <td className="py-2 pr-4">
                          ₹{c.stockValue?.toLocaleString?.()}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="transactions" className="w-full">
        <TabsList className="glass-card">
          <TabsTrigger value="transactions">Recent Transactions</TabsTrigger>
          <TabsTrigger value="alerts">Inventory Analytics</TabsTrigger>
          <TabsTrigger value="products">My Products</TabsTrigger>
          <TabsTrigger value="companies">Companies</TabsTrigger>
        </TabsList>
        <TabsContent value="transactions" className="mt-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-brand-gradient">
                Recent Transactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-muted-foreground">
                      <th className="py-2 pr-4">Type</th>
                      <th className="py-2 pr-4">Product</th>
                      <th className="py-2 pr-4">Qty</th>
                      <th className="py-2 pr-4">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(summary?.recentTransactions ?? []).map((t) => (
                      <tr key={t.id} className="border-t">
                        <td className="py-2 pr-4">{t.type}</td>
                        <td className="py-2 pr-4">{t.product?.name}</td>
                        <td className="py-2 pr-4">{t.quantity}</td>
                        <td className="py-2 pr-4">
                          {new Date(t.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="alerts" className="mt-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-brand-gradient">
                Inventory Analytics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 rounded-md bg-muted/40">
                  <p className="text-xs text-muted-foreground">Total Value</p>
                  <p className="text-lg font-semibold">
                    {formatCurrency(
                      analytics?.inventoryMetrics?.totalValue ?? 0
                    )}
                  </p>
                </div>
                <div className="p-3 rounded-md bg-muted/40">
                  <p className="text-xs text-muted-foreground">Turnover Rate</p>
                  <p className="text-lg font-semibold">
                    {formatNumber(
                      analytics?.inventoryMetrics?.turnoverRate ?? 0
                    )}
                  </p>
                </div>
                <div className="p-3 rounded-md bg-muted/40">
                  <p className="text-xs text-muted-foreground">Low Stock</p>
                  <p className="text-lg font-semibold text-amber-600">
                    {formatNumber(
                      analytics?.inventoryMetrics?.lowStockCount ?? 0
                    )}
                  </p>
                </div>
                <div className="p-3 rounded-md bg-muted/40">
                  <p className="text-xs text-muted-foreground">Out of Stock</p>
                  <p className="text-lg font-semibold text-red-600">
                    {formatNumber(
                      analytics?.inventoryMetrics?.outOfStockCount ?? 0
                    )}
                  </p>
                </div>
              </div>

              {/* Category Breakdown */}
              <div>
                <h4 className="text-sm font-medium mb-2">Category Breakdown</h4>
                {!analytics ||
                (analytics.categoryBreakdown?.length ?? 0) === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    No category data available.
                  </p>
                ) : (
                  <>
                    <div className="overflow-x-auto mb-4">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-muted-foreground">
                            <th className="py-2 pr-4">Category</th>
                            <th className="py-2 pr-4">Products</th>
                            <th className="py-2 pr-4">Stock</th>
                            <th className="py-2 pr-4">Value</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(analytics?.categoryBreakdown ?? []).map(
                            (c, idx) => (
                              <tr key={idx} className="border-t">
                                <td className="py-2 pr-4">{c.category}</td>
                                <td className="py-2 pr-4">
                                  {formatNumber(c.productCount)}
                                </td>
                                <td className="py-2 pr-4">
                                  {formatNumber(c.totalStock)}
                                </td>
                                <td className="py-2 pr-4">
                                  {formatCurrency(c.value)}
                                </td>
                              </tr>
                            )
                          )}
                        </tbody>
                      </table>
                    </div>
                    <div>
                      <h5 className="text-xs font-medium mb-1 text-muted-foreground">
                        Value Distribution
                      </h5>
                      <div className="flex items-end gap-1 h-40 rounded-md bg-muted/30 p-2 overflow-x-auto">
                        {(analytics?.categoryBreakdown ?? []).map(
                          (c, i, arr) => {
                            const max =
                              arr.reduce(
                                (m, x) => (x.value > m ? x.value : m),
                                0
                              ) || 1;
                            const h = Math.max(6, (c.value / max) * 100);
                            return (
                              <div
                                key={c.category + i}
                                className="flex flex-col items-center justify-end"
                              >
                                <div
                                  title={`${c.category}: ${formatCurrency(
                                    c.value
                                  )}`}
                                  style={{ height: h + "%" }}
                                  className="w-4 bg-gradient-to-t from-primary/60 to-primary/30 rounded-sm"
                                />
                                <span
                                  className="mt-1 text-[10px] max-w-[3ch] truncate"
                                  title={c.category}
                                >
                                  {c.category.slice(0, 3)}
                                </span>
                              </div>
                            );
                          }
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="products" className="mt-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-brand-gradient">My Products</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ProductsTable refreshSummaryRef={refreshSummary} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="companies" className="mt-4">
          <Card className="glass-card">
            <CardHeader className="flex items-center justify-between">
              <CardTitle className="text-brand-gradient">Companies</CardTitle>
            </CardHeader>
            <CardContent>
              <CompaniesSection />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ProductsTable({
  refreshSummaryRef,
}: {
  refreshSummaryRef: React.MutableRefObject<() => Promise<void>>;
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [eyewearType, setEyewearType] = useState<string>("");
  const [companyId, setCompanyId] = useState<string>("");
  const [companies, setCompanies] = useState<
    Array<{ id: number; name: string }>
  >([]);
  const [page, setPage] = useState(1);
  const [addRetailerOpen, setAddRetailerOpen] = useState(false);
  const [editing, setEditing] = useState<{
    open: boolean;
    id?: number;
    wholesalePrice: string;
    retailPrice: string;
    isActive: boolean;
    saving?: boolean;
  }>({ open: false, wholesalePrice: "", retailPrice: "", isActive: true });
  const [stockAdj, setStockAdj] = useState<{
    open: boolean;
    id?: number;
    quantity: string;
    type: "ADD" | "REMOVE";
    reason: string;
    costPrice: string;
    supplier: string;
    saving: boolean;
  }>({
    open: false,
    quantity: "",
    type: "ADD",
    reason: "",
    costPrice: "",
    supplier: "",
    saving: false,
  });
  type ProductRow = {
    id: number;
    product?: { name?: string; company?: { name?: string } } | null;
    totalStock?: number;
    availableStock?: number;
    allocatedStock?: number;
    retailPrice?: number; // backend field per docs (retailPrice)
    wholesalePrice?: number;
    stockStatus?: string;
    stockValue?: number;
  };
  const [data, setData] = useState<{
    products: ProductRow[];
    pagination?: { page: number; pages: number; total: number } | null;
  }>({ products: [], pagination: null });
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailProduct, setDetailProduct] = useState<ProductRow | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const openDetail = async (p: ProductRow) => {
    setDetailProduct(p);
    setDetailOpen(true);
    setDetailLoading(false); // placeholder for potential future fetch
  };

  const fetchData = async (pg = 1) => {
    try {
      setLoading(true);
      const res = await RetailerAPI.inventory.myProducts({
        search: query || undefined,
        eyewearType:
          (eyewearType as "GLASSES" | "SUNGLASSES" | "LENSES" | "") ||
          undefined,
        companyId: companyId ? Number(companyId) : undefined,
        page: pg,
        limit: 10,
      });
      setData((res as any) || { products: [], pagination: null });
    } catch (e) {
      const message =
        typeof e === "object" && e && "message" in e
          ? String((e as { message?: unknown }).message)
          : undefined;
      setError(message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const fetchRef = useRef(fetchData);
  // Hydrate filters from localStorage once
  useEffect(() => {
    try {
      const raw = localStorage.getItem("retailerInventoryFilters");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.query) setQuery(parsed.query);
        if (parsed.eyewearType) setEyewearType(parsed.eyewearType);
        if (parsed.companyId) setCompanyId(String(parsed.companyId));
      }
    } catch {
      /* ignore */
    }
  }, []);
  // Persist filters (debounced)
  useEffect(() => {
    const id = setTimeout(() => {
      try {
        localStorage.setItem(
          "retailerInventoryFilters",
          JSON.stringify({ query, eyewearType, companyId })
        );
      } catch {
        /* ignore */
      }
    }, 250);
    return () => clearTimeout(id);
  }, [query, eyewearType, companyId]);
  useEffect(() => {
    fetchRef.current = fetchData;
  });
  useEffect(() => {
    fetchRef.current(1);
  }, [query, eyewearType, companyId]);
  useEffect(() => {
    (async () => {
      try {
        const comps = await RetailerAPI.inventory.companies();
        setCompanies(
          (comps as any)?.map((c: any) => ({ id: c.id, name: c.name })) || []
        );
      } catch {
        /* ignore */
      }
    })();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center flex-wrap">
        <Input
          placeholder="Search name, SKU, barcode"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          className="border rounded-md p-2"
          value={eyewearType}
          onChange={(e) => setEyewearType(e.target.value)}
        >
          <option value="">All types</option>
          <option value="GLASSES">Glasses</option>
          <option value="SUNGLASSES">Sunglasses</option>
          <option value="LENSES">Lenses</option>
        </select>
        <select
          className="border rounded-md p-2"
          value={companyId}
          onChange={(e) => setCompanyId(e.target.value)}
        >
          <option value="">All companies</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <Button onClick={() => fetchData(1)}>Apply</Button>
        <Dialog
          open={addRetailerOpen}
          onOpenChange={(o) => {
            setAddRetailerOpen(o);
          }}
        >
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              Add Retailer Product
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Retailer Product</DialogTitle>
            </DialogHeader>
            <RetailerAddProductForm
              existing={(data.products || []).map((p) =>
                p.product?.name?.toLowerCase?.()
              )}
              onCancel={() => setAddRetailerOpen(false)}
              onAdded={(createdOptimistic: any) => {
                setData((d) =>
                  page === 1
                    ? { ...d, products: [createdOptimistic, ...d.products] }
                    : d
                );
                setTimeout(() => fetchData(page), 300);
                try {
                  refreshSummaryRef.current?.();
                } catch {}
                setAddRetailerOpen(false);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <Skeleton className="h-32 w-full" />
      ) : error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground">
                  <th className="py-2 pr-4">Product</th>
                  <th className="py-2 pr-4">Company</th>
                  <th className="py-2 pr-4">Total</th>
                  <th className="py-2 pr-4">Available</th>
                  <th className="py-2 pr-4">Allocated</th>
                  <th className="py-2 pr-4">Retail Price</th>
                  <th className="py-2 pr-4">Wholesale</th>
                  <th className="py-2 pr-4">Stock Value</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Active</th>
                  <th className="py-2 pr-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(data.products ?? []).map((p: ProductRow) => (
                  <tr key={p.id} className="border-t">
                    <td
                      className="py-2 pr-4 font-medium underline-offset-2 hover:underline cursor-pointer"
                      onClick={() => openDetail(p)}
                    >
                      {p.product?.name}
                    </td>
                    <td className="py-2 pr-4">{p.product?.company?.name}</td>
                    <td className="py-2 pr-4">
                      {p.totalStock ??
                        (p.availableStock ?? 0) + (p.allocatedStock ?? 0)}
                    </td>
                    <td className="py-2 pr-4">{p.availableStock}</td>
                    <td className="py-2 pr-4">{p.allocatedStock}</td>
                    <td className="py-2 pr-4">
                      ₹{p.retailPrice?.toLocaleString?.()}
                    </td>
                    <td className="py-2 pr-4">
                      ₹{p.wholesalePrice?.toLocaleString?.()}
                    </td>
                    <td className="py-2 pr-4">
                      ₹{p.stockValue?.toLocaleString?.()}
                    </td>
                    <td className="py-2 pr-4">
                      {p.stockStatus ? (
                        <span
                          className={`inline-block rounded px-2 py-0.5 text-xs font-medium bg-muted/60`}
                        >
                          {p.stockStatus}
                        </span>
                      ) : null}
                    </td>
                    <td className="py-2 pr-4">
                      <span
                        className={`inline-block rounded px-2 py-0.5 text-xs ${"bg-muted/60"}`}
                      >
                        {(p as any).isActive === false ? "No" : "Yes"}
                      </span>
                    </td>
                    <td className="py-2 pr-4 space-x-2 whitespace-nowrap">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setEditing({
                            open: true,
                            id: p.id,
                            wholesalePrice: String(p.wholesalePrice ?? ""),
                            retailPrice: String(p.retailPrice ?? ""),
                            isActive: true,
                          })
                        }
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setStockAdj({
                            open: true,
                            id: p.id,
                            quantity: "",
                            type: "ADD",
                            reason: "",
                            costPrice: "",
                            supplier: "",
                            saving: false,
                          })
                        }
                      >
                        Stock
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data.pagination && (
            <div className="flex items-center justify-between mt-4 text-xs">
              <div>
                Page {data.pagination.page} of {data.pagination.pages} • Total{" "}
                {data.pagination.total}
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page <= 1}
                  onClick={() => {
                    const np = Math.max(1, page - 1);
                    setPage(np);
                    fetchData(np);
                  }}
                >
                  Prev
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page >= data.pagination.pages}
                  onClick={() => {
                    const np = Math.min(data.pagination!.pages, page + 1);
                    setPage(np);
                    fetchData(np);
                  }}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Edit Retailer Product */}
      <Dialog
        open={editing.open}
        onOpenChange={(o) => {
          if (!o)
            setEditing({
              open: false,
              wholesalePrice: "",
              retailPrice: "",
              isActive: true,
            });
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Retailer Product</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Wholesale Price"
              type="number"
              value={editing.wholesalePrice}
              onChange={(e) =>
                setEditing({ ...editing, wholesalePrice: e.target.value })
              }
            />
            <Input
              placeholder="Retail Price"
              type="number"
              value={editing.retailPrice}
              onChange={(e) =>
                setEditing({ ...editing, retailPrice: e.target.value })
              }
            />
            <div className="flex items-center gap-2 text-xs">
              <input
                id="isActive"
                type="checkbox"
                checked={editing.isActive}
                onChange={(e) =>
                  setEditing({ ...editing, isActive: e.target.checked })
                }
              />
              <label htmlFor="isActive">Active</label>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() =>
                  setEditing({
                    open: false,
                    wholesalePrice: "",
                    retailPrice: "",
                    isActive: true,
                  })
                }
              >
                Cancel
              </Button>
              <Button
                disabled={editing.saving}
                onClick={async () => {
                  if (!editing.id) return;
                  const ws = editing.wholesalePrice
                    ? parseFloat(editing.wholesalePrice)
                    : undefined;
                  const rp = editing.retailPrice
                    ? parseFloat(editing.retailPrice)
                    : undefined;
                  if (
                    (ws !== undefined && (isNaN(ws) || ws <= 0)) ||
                    (rp !== undefined && (isNaN(rp) || rp <= 0))
                  ) {
                    toast.error("Enter valid positive numbers");
                    return;
                  }
                  if (ws !== undefined && rp !== undefined && rp < ws) {
                    toast.error("Retail price must be >= wholesale");
                    return;
                  }
                  try {
                    setEditing((ed) => ({ ...ed, saving: true }));
                    await RetailerAPI.inventory.updateRetailerProduct(
                      editing.id,
                      {
                        wholesalePrice: ws,
                        retailPrice: rp,
                        isActive: editing.isActive,
                      }
                    );
                    // Optimistic update
                    setData((d) => ({
                      ...d,
                      products: d.products.map((p) =>
                        p.id === editing.id
                          ? {
                              ...p,
                              wholesalePrice: ws ?? p.wholesalePrice,
                              retailPrice: rp ?? p.retailPrice,
                              isActive: editing.isActive,
                            }
                          : p
                      ),
                    }));
                    toast.success("Updated");
                    setEditing({
                      open: false,
                      wholesalePrice: "",
                      retailPrice: "",
                      isActive: true,
                    });
                    setTimeout(() => fetchData(page), 300);
                    try {
                      refreshSummaryRef.current?.();
                    } catch {}
                  } catch (e: any) {
                    toast.error(e?.message || "Update failed");
                  } finally {
                    setEditing({
                      open: false,
                      wholesalePrice: "",
                      retailPrice: "",
                      isActive: true,
                    });
                  }
                }}
              >
                {editing.saving ? "Saving…" : "Save"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Product Detail Drawer (Sheet) */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {detailProduct?.product?.name || "Product Detail"}
            </DialogTitle>
          </DialogHeader>
          {detailLoading && <Skeleton className="h-20 w-full" />}
          {!detailLoading && detailProduct && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div className="clay p-3 rounded-lg">
                  <div className="text-[10px] uppercase text-muted-foreground">
                    Company
                  </div>
                  <div>{detailProduct.product?.company?.name || "—"}</div>
                </div>
                <div className="clay p-3 rounded-lg">
                  <div className="text-[10px] uppercase text-muted-foreground">
                    Status
                  </div>
                  <div>{detailProduct.stockStatus || "—"}</div>
                </div>
                <div className="clay p-3 rounded-lg">
                  <div className="text-[10px] uppercase text-muted-foreground">
                    Available
                  </div>
                  <div>{detailProduct.availableStock ?? "—"}</div>
                </div>
                <div className="clay p-3 rounded-lg">
                  <div className="text-[10px] uppercase text-muted-foreground">
                    Allocated
                  </div>
                  <div>{detailProduct.allocatedStock ?? "—"}</div>
                </div>
                <div className="clay p-3 rounded-lg">
                  <div className="text-[10px] uppercase text-muted-foreground">
                    Retail
                  </div>
                  <div>
                    ₹{detailProduct.retailPrice?.toLocaleString?.() || "—"}
                  </div>
                </div>
                <div className="clay p-3 rounded-lg">
                  <div className="text-[10px] uppercase text-muted-foreground">
                    Wholesale
                  </div>
                  <div>
                    ₹{detailProduct.wholesalePrice?.toLocaleString?.() || "—"}
                  </div>
                </div>
              </div>
              <div>
                <h4 className="text-xs font-medium mb-2 text-muted-foreground uppercase tracking-wide">
                  Pricing History
                </h4>
                <p className="text-xs text-muted-foreground">
                  (Not yet implemented)
                </p>
              </div>
              <div>
                <h4 className="text-xs font-medium mb-2 text-muted-foreground uppercase tracking-wide">
                  Stock Breakdown
                </h4>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-muted-foreground">
                      <th className="py-1 pr-4">Metric</th>
                      <th className="py-1 pr-4">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t">
                      <td className="py-1 pr-4">Total</td>
                      <td className="py-1 pr-4">
                        {detailProduct.totalStock ??
                          (detailProduct.availableStock ?? 0) +
                            (detailProduct.allocatedStock ?? 0)}
                      </td>
                    </tr>
                    <tr className="border-t">
                      <td className="py-1 pr-4">Stock Value</td>
                      <td className="py-1 pr-4">
                        ₹{detailProduct.stockValue?.toLocaleString?.() || 0}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Stock Adjustment */}
      <Dialog
        open={stockAdj.open}
        onOpenChange={(o) => {
          if (!o)
            setStockAdj({
              open: false,
              quantity: "",
              type: "ADD",
              reason: "",
              costPrice: "",
              supplier: "",
              saving: false,
            });
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Stock</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm" aria-live="polite">
            <Input
              placeholder="Quantity"
              type="number"
              value={stockAdj.quantity}
              onChange={(e) =>
                setStockAdj({ ...stockAdj, quantity: e.target.value })
              }
            />
            <select
              className="border rounded-md p-2 w-full"
              value={stockAdj.type}
              onChange={(e) =>
                setStockAdj({
                  ...stockAdj,
                  type: e.target.value as "ADD" | "REMOVE",
                })
              }
            >
              <option value="ADD">ADD</option>
              <option value="REMOVE">REMOVE</option>
            </select>
            <Input
              placeholder="Reason (optional)"
              value={stockAdj.reason}
              onChange={(e) =>
                setStockAdj({ ...stockAdj, reason: e.target.value })
              }
            />
            <Input
              placeholder="Cost Price (optional)"
              type="number"
              value={stockAdj.costPrice}
              onChange={(e) =>
                setStockAdj({ ...stockAdj, costPrice: e.target.value })
              }
            />
            <Input
              placeholder="Supplier (optional)"
              value={stockAdj.supplier}
              onChange={(e) =>
                setStockAdj({ ...stockAdj, supplier: e.target.value })
              }
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() =>
                  setStockAdj({
                    open: false,
                    quantity: "",
                    type: "ADD",
                    reason: "",
                    costPrice: "",
                    supplier: "",
                    saving: false,
                  })
                }
              >
                Cancel
              </Button>
              <Button
                disabled={stockAdj.saving}
                onClick={async () => {
                  const qty = parseInt(stockAdj.quantity, 10);
                  if (!qty || isNaN(qty) || qty <= 0) {
                    toast.error("Enter a positive quantity");
                    return;
                  }
                  if (!stockAdj.id) return;
                  try {
                    setStockAdj((s) => ({ ...s, saving: true }));
                    const delta = stockAdj.type === "ADD" ? qty : -qty;
                    // optimistic update with stock value + status recompute
                    setData((d) => ({
                      ...d,
                      products: d.products.map((p) => {
                        if (p.id !== stockAdj.id) return p;
                        const newAvail = (p.availableStock ?? 0) + delta;
                        const total =
                          p.totalStock ??
                          (p.availableStock ?? 0) +
                            (p.allocatedStock ?? 0) +
                            delta;
                        const wholesale = p.wholesalePrice ?? 0;
                        const stockValue =
                          wholesale > 0 ? wholesale * newAvail : p.stockValue;
                        let stockStatus = p.stockStatus;
                        if (newAvail <= 0) stockStatus = "OUT";
                        else if (newAvail < 5) stockStatus = "LOW";
                        else stockStatus = "OK";
                        return {
                          ...p,
                          availableStock: newAvail,
                          totalStock: total,
                          stockValue,
                          stockStatus,
                        };
                      }),
                    }));
                    await RetailerAPI.inventory.updateStock(stockAdj.id, {
                      quantity: qty,
                      type: stockAdj.type,
                      reason: stockAdj.reason || undefined,
                      costPrice: stockAdj.costPrice
                        ? parseFloat(stockAdj.costPrice)
                        : undefined,
                      supplier: stockAdj.supplier || undefined,
                    });
                    toast.success("Stock updated");
                    setStockAdj({
                      open: false,
                      quantity: "",
                      type: "ADD",
                      reason: "",
                      costPrice: "",
                      supplier: "",
                      saving: false,
                    });
                    setTimeout(() => fetchData(page), 400);
                    try {
                      refreshSummaryRef.current?.();
                    } catch {}
                  } catch (e: any) {
                    toast.error(e?.message || "Adjustment failed");
                    setTimeout(() => fetchData(page), 100);
                  }
                }}
              >
                {stockAdj.saving ? "Saving…" : "Apply"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CompaniesSection() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  type CompanyRow = {
    id: number;
    name: string;
    description?: string;
    productCount?: number;
  };
  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [openAdd, setOpenAdd] = useState(false);
  const [newCompany, setNewCompany] = useState({ name: "", description: "" });
  const [savingAdd, setSavingAdd] = useState(false);
  const [nameErr, setNameErr] = useState<string | null>(null);
  const [viewCompany, setViewCompany] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [companyProducts, setCompanyProducts] = useState<any[] | null>(null);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [companyProductsPage, setCompanyProductsPage] = useState(1);
  const [companyProductsLimit] = useState(10);
  const [companyProductsTotal, setCompanyProductsTotal] = useState<
    number | null
  >(null);
  const [companyProductsType, setCompanyProductsType] = useState<string>(""); // '' means all
  const [productsError, setProductsError] = useState<string | null>(null);
  // edit product modal state
  const [editProduct, setEditProduct] = useState<any | null>(null);
  const [savingProduct, setSavingProduct] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCompanies = async (opts: { silent?: boolean } = {}) => {
    try {
      if (!opts.silent) setLoading(true);
      else setRefreshing(true);
      setError(null);
      const res: any = await RetailerAPI.inventory.companies();
      // Accept either array or { companies: [] }
      const list: any[] = Array.isArray(res) ? res : res?.companies || [];
      setCompanies(
        list.map((c) => ({
          id: c.id,
          name: c.name,
          description: c.description,
          productCount: c.productCount ?? c.productsCount ?? c.totalProducts, // tolerate backend naming variants
        }))
      );
    } catch (e) {
      const message =
        typeof e === "object" && e && "message" in e
          ? String((e as { message?: unknown }).message)
          : undefined;
      setError(message || "Failed to load companies");
      setCompanies([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchCompaniesRef = useRef(fetchCompanies);
  useEffect(() => {
    fetchCompaniesRef.current = fetchCompanies;
  });
  useEffect(() => {
    fetchCompaniesRef.current();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center gap-2">
        <div className="text-xs text-muted-foreground">
          {loading
            ? "Loading companies…"
            : `${companies.length} compan${
                companies.length === 1 ? "y" : "ies"
              }`}
        </div>
        <Dialog
          open={openAdd}
          onOpenChange={(o) => {
            setOpenAdd(o);
            if (o) {
              // reset form each open, preserve previously typed? keep current if reopening due to validation
              setTimeout(() => {
                try {
                  (
                    document.getElementById(
                      "company-name-input"
                    ) as HTMLInputElement | null
                  )?.focus();
                } catch {}
              }, 10);
            } else {
              setNewCompany({ name: "", description: "" });
              setNameErr(null);
            }
          }}
        >
          <DialogTrigger asChild>
            <Button>Add Company</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Company</DialogTitle>
            </DialogHeader>
            <div
              className="space-y-3"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  (
                    document.getElementById(
                      "company-submit-btn"
                    ) as HTMLButtonElement | null
                  )?.click();
                }
              }}
            >
              <div className="space-y-1">
                <Input
                  id="company-name-input"
                  aria-invalid={!!nameErr}
                  aria-describedby={nameErr ? "company-name-error" : undefined}
                  placeholder="Name"
                  value={newCompany.name}
                  onChange={(e) => {
                    const v = e.target.value;
                    setNewCompany({ ...newCompany, name: v });
                    if (v.trim().length < 2)
                      setNameErr("Name must be at least 2 characters");
                    else setNameErr(null);
                  }}
                />
                {nameErr && (
                  <p id="company-name-error" className="text-xs text-red-600">
                    {nameErr}
                  </p>
                )}
              </div>
              <Input
                placeholder="Description (optional)"
                value={newCompany.description}
                onChange={(e) =>
                  setNewCompany({ ...newCompany, description: e.target.value })
                }
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setOpenAdd(false)}
                >
                  Cancel
                </Button>
                <Button
                  id="company-submit-btn"
                  disabled={
                    savingAdd || !!nameErr || newCompany.name.trim().length < 2
                  }
                  onClick={async () => {
                    if (savingAdd) return; // double submit guard
                    const nm = newCompany.name.trim();
                    if (nm.length < 2) {
                      setNameErr("Name must be at least 2 characters");
                      return;
                    }
                    setNameErr(null);
                    try {
                      setSavingAdd(true);
                      const createPayload = {
                        name: nm,
                        description: newCompany.description || undefined,
                      };
                      const created: any =
                        await RetailerAPI.inventory.addCompany(createPayload);
                      toast.success("Company added");
                      setCompanies((prev) => [
                        {
                          id: created?.id ?? Date.now(),
                          name: nm,
                          description: createPayload.description,
                        },
                        ...prev,
                      ]);
                      setNewCompany({ name: "", description: "" });
                      setOpenAdd(false);
                      fetchCompanies({ silent: true });
                    } catch (e) {
                      toast.error((e as any)?.message || "Failed to add");
                    } finally {
                      setSavingAdd(false);
                    }
                  }}
                >
                  {savingAdd ? "Saving…" : "Save"}
                </Button>
              </div>
              <div aria-live="polite" className="sr-only">
                {savingAdd ? "Saving company" : nameErr ? nameErr : "Ready"}
              </div>
            </div>
          </DialogContent>
        </Dialog>
        <Button
          variant="outline"
          size="sm"
          disabled={loading || refreshing}
          onClick={() => fetchCompanies({ silent: true })}
        >
          {refreshing ? "Refreshing…" : "Refresh"}
        </Button>
      </div>

      {loading ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground">
                <th className="py-2 pr-4">Name</th>
                <th className="py-2 pr-4">Products</th>
                <th className="py-2 pr-4">Description</th>
                <th className="py-2 pr-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 3 }).map((_, i) => (
                <tr key={i} className="border-t">
                  <td className="py-2 pr-4">
                    <Skeleton className="h-4 w-32" />
                  </td>
                  <td className="py-2 pr-4">
                    <Skeleton className="h-4 w-14" />
                  </td>
                  <td className="py-2 pr-4">
                    <Skeleton className="h-4 w-40" />
                  </td>
                  <td className="py-2 pr-4">
                    <Skeleton className="h-6 w-32" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : error ? (
        <Alert
          variant="destructive"
          className="flex items-center justify-between gap-4"
        >
          <AlertDescription className="text-sm">{error}</AlertDescription>
          <Button size="sm" variant="outline" onClick={() => fetchCompanies()}>
            Retry
          </Button>
        </Alert>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground">
                <th className="py-2 pr-4">Name</th>
                <th className="py-2 pr-4">Products</th>
                <th className="py-2 pr-4">Description</th>
                <th className="py-2 pr-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {companies.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="py-6 text-center text-muted-foreground text-sm"
                  >
                    No companies yet. Use "Add Company" to create one.
                  </td>
                </tr>
              )}
              {companies.map((c: CompanyRow) => (
                <tr key={c.id} className="border-t">
                  <td className="py-2 pr-4 font-medium">{c.name}</td>
                  <td className="py-2 pr-4">
                    {c.productCount != null ? c.productCount : "-"}
                  </td>
                  <td
                    className="py-2 pr-4 max-w-xs truncate"
                    title={c.description}
                  >
                    {c.description || (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="py-2 pr-4 space-x-2">
                    <span className="text-[10px] inline-block px-2 py-1 rounded bg-muted/40 text-muted-foreground">
                      Edit disabled (not in API spec)
                    </span>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={async () => {
                        setViewCompany({ id: c.id, name: c.name });
                        setCompanyProductsPage(1);
                        setCompanyProductsType("");
                        setLoadingProducts(true);
                        setProductsError(null);
                        try {
                          const res: any =
                            await RetailerAPI.inventory.productsByCompany(
                              c.id,
                              { page: 1, limit: companyProductsLimit }
                            );
                          setCompanyProducts(res?.products || []);
                          setCompanyProductsTotal(res?.total ?? null);
                        } catch (e) {
                          const msg =
                            (e as any)?.message || "Failed to load products";
                          toast.error(msg);
                          setProductsError(msg);
                          setCompanyProducts([]);
                        } finally {
                          setLoadingProducts(false);
                        }
                      }}
                    >
                      Products
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {viewCompany && (
        <div className="border rounded-md p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Products - {viewCompany.name}</h4>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setViewCompany(null);
                setCompanyProducts(null);
              }}
            >
              Close
            </Button>
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-3 items-end">
              <div className="space-y-1 text-xs">
                <label
                  htmlFor="eyewear-filter"
                  className="block font-medium text-[11px] uppercase tracking-wide text-muted-foreground"
                >
                  Eyewear Type
                </label>
                <select
                  id="eyewear-filter"
                  className="border rounded-md p-2 text-sm"
                  value={companyProductsType}
                  onChange={async (e) => {
                    const val = e.target.value;
                    setCompanyProductsType(val);
                    setCompanyProductsPage(1);
                    setLoadingProducts(true);
                    setProductsError(null);
                    try {
                      const res: any =
                        await RetailerAPI.inventory.productsByCompany(
                          viewCompany.id,
                          {
                            page: 1,
                            limit: companyProductsLimit,
                            eyewearType: (val || undefined) as any,
                          }
                        );
                      setCompanyProducts(res?.products || []);
                      setCompanyProductsTotal(res?.total ?? null);
                    } catch (er) {
                      const msg =
                        (er as any)?.message || "Failed to load products";
                      toast.error(msg);
                      setProductsError(msg);
                      setCompanyProducts([]);
                    } finally {
                      setLoadingProducts(false);
                    }
                  }}
                >
                  <option value="">All</option>
                  <option value="GLASSES">Glasses</option>
                  <option value="SUNGLASSES">Sunglasses</option>
                  <option value="LENSES">Lenses</option>
                </select>
              </div>
              <AddProductInline
                companyId={viewCompany.id}
                onAdded={async () => {
                  try {
                    const res: any =
                      await RetailerAPI.inventory.productsByCompany(
                        viewCompany.id,
                        {
                          page: companyProductsPage,
                          limit: companyProductsLimit,
                          eyewearType: (companyProductsType ||
                            undefined) as any,
                        }
                      );
                    setCompanyProducts(res?.products || []);
                    setCompanyProductsTotal(res?.total ?? null);
                  } catch {
                    /* ignore */
                  }
                }}
              />
            </div>
            {loadingProducts ? (
              <div className="overflow-x-auto max-h-72">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-muted-foreground">
                      <th className="py-2 pr-4">Name</th>
                      <th className="py-2 pr-4">Type</th>
                      <th className="py-2 pr-4">Base Price</th>
                      <th className="py-2 pr-4">SKU</th>
                      <th className="py-2 pr-4">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: 4 }).map((_, i) => (
                      <tr key={i} className="border-t">
                        <td className="py-2 pr-4">
                          <Skeleton className="h-4 w-36" />
                        </td>
                        <td className="py-2 pr-4">
                          <Skeleton className="h-4 w-16" />
                        </td>
                        <td className="py-2 pr-4">
                          <Skeleton className="h-4 w-20" />
                        </td>
                        <td className="py-2 pr-4">
                          <Skeleton className="h-4 w-20" />
                        </td>
                        <td className="py-2 pr-4">
                          <Skeleton className="h-6 w-24" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : productsError ? (
              <div className="text-sm text-red-600 flex items-center gap-3">
                {productsError}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    setLoadingProducts(true);
                    setProductsError(null);
                    try {
                      const res: any =
                        await RetailerAPI.inventory.productsByCompany(
                          viewCompany.id,
                          {
                            page: companyProductsPage,
                            limit: companyProductsLimit,
                            eyewearType: (companyProductsType ||
                              undefined) as any,
                          }
                        );
                      setCompanyProducts(res?.products || []);
                      setCompanyProductsTotal(res?.total ?? null);
                    } catch (er) {
                      const msg =
                        (er as any)?.message || "Failed to load products";
                      setProductsError(msg);
                    } finally {
                      setLoadingProducts(false);
                    }
                  }}
                >
                  Retry
                </Button>
              </div>
            ) : companyProducts && companyProducts.length > 0 ? (
              <div className="overflow-x-auto max-h-72">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-muted-foreground">
                      <th className="py-2 pr-4">Name</th>
                      <th className="py-2 pr-4">Type</th>
                      <th className="py-2 pr-4">Base Price</th>
                      <th className="py-2 pr-4">SKU</th>
                      <th className="py-2 pr-4">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {companyProducts.map((p: any) => (
                      <tr key={p.id} className="border-t">
                        <td className="py-2 pr-4">{p.name}</td>
                        <td className="py-2 pr-4 text-xs">{p.eyewearType}</td>
                        <td className="py-2 pr-4">
                          ₹{p.basePrice?.toLocaleString?.()}
                        </td>
                        <td className="py-2 pr-4">{p.sku}</td>
                        <td className="py-2 pr-4">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              disabled
                              title="Add to retailer inventory form coming soon"
                            >
                              Add to My Products
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditProduct(p)}
                            >
                              Edit
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No products for this company.
              </p>
            )}
            <div className="flex items-center justify-between pt-2">
              <div className="text-xs text-muted-foreground">
                Page {companyProductsPage}
                {companyProductsTotal != null
                  ? ` of ${Math.max(
                      1,
                      Math.ceil(companyProductsTotal / companyProductsLimit)
                    )}`
                  : ""}{" "}
                •{" "}
                {companyProductsTotal != null
                  ? `${companyProductsTotal} total`
                  : `${companyProducts?.length || 0} loaded`}
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={companyProductsPage === 1 || loadingProducts}
                  onClick={async () => {
                    if (companyProductsPage === 1) return;
                    const newPage = companyProductsPage - 1;
                    setCompanyProductsPage(newPage);
                    setLoadingProducts(true);
                    try {
                      const res: any =
                        await RetailerAPI.inventory.productsByCompany(
                          viewCompany.id,
                          {
                            page: newPage,
                            limit: companyProductsLimit,
                            eyewearType: (companyProductsType ||
                              undefined) as any,
                          }
                        );
                      setCompanyProducts(res?.products || []);
                      setCompanyProductsTotal(
                        res?.total ?? companyProductsTotal
                      );
                    } catch (er) {
                      toast.error((er as any)?.message || "Load failed");
                    } finally {
                      setLoadingProducts(false);
                    }
                  }}
                >
                  Prev
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={
                    loadingProducts ||
                    (companyProductsTotal != null &&
                      companyProductsPage * companyProductsLimit >=
                        companyProductsTotal) ||
                    (companyProducts?.length || 0) < companyProductsLimit
                  }
                  onClick={async () => {
                    if (
                      companyProductsTotal != null &&
                      companyProductsPage * companyProductsLimit >=
                        companyProductsTotal
                    )
                      return;
                    const newPage = companyProductsPage + 1;
                    setCompanyProductsPage(newPage);
                    setLoadingProducts(true);
                    try {
                      const res: any =
                        await RetailerAPI.inventory.productsByCompany(
                          viewCompany.id,
                          {
                            page: newPage,
                            limit: companyProductsLimit,
                            eyewearType: (companyProductsType ||
                              undefined) as any,
                          }
                        );
                      setCompanyProducts(res?.products || []);
                      setCompanyProductsTotal(
                        res?.total ?? companyProductsTotal
                      );
                    } catch (er) {
                      toast.error((er as any)?.message || "Load failed");
                    } finally {
                      setLoadingProducts(false);
                    }
                  }}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
          <Dialog
            open={!!editProduct}
            onOpenChange={(o) => {
              if (!o) setEditProduct(null);
            }}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Product</DialogTitle>
              </DialogHeader>
              {editProduct && (
                <div
                  className="space-y-3 text-sm"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      (
                        document.getElementById(
                          "edit-prod-submit"
                        ) as HTMLButtonElement | null
                      )?.click();
                    }
                  }}
                >
                  <Input
                    placeholder="Name"
                    value={editProduct.name}
                    onChange={(e) =>
                      setEditProduct({ ...editProduct, name: e.target.value })
                    }
                  />
                  <Input
                    placeholder="Description (optional)"
                    value={editProduct.description || ""}
                    onChange={(e) =>
                      setEditProduct({
                        ...editProduct,
                        description: e.target.value,
                      })
                    }
                  />
                  <Input
                    type="number"
                    placeholder="Base Price"
                    value={editProduct.basePrice}
                    onChange={(e) =>
                      setEditProduct({
                        ...editProduct,
                        basePrice: e.target.value,
                      })
                    }
                  />
                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      variant="outline"
                      onClick={() => setEditProduct(null)}
                    >
                      Cancel
                    </Button>
                    <Button
                      id="edit-prod-submit"
                      disabled={
                        savingProduct ||
                        !editProduct.name.trim() ||
                        !(parseFloat(editProduct.basePrice) > 0)
                      }
                      onClick={async () => {
                        if (!editProduct) return;
                        const priceNum = parseFloat(editProduct.basePrice);
                        if (!(priceNum > 0)) {
                          toast.error("Price must be > 0");
                          return;
                        }
                        try {
                          setSavingProduct(true);
                          const payload = {
                            name: editProduct.name.trim(),
                            description: editProduct.description || undefined,
                            basePrice: priceNum,
                          };
                          await RetailerAPI.inventory.updateProduct(
                            editProduct.id,
                            payload as any
                          );
                          toast.success("Updated");
                          setCompanyProducts((list) =>
                            (list || []).map((p) =>
                              p.id === editProduct.id
                                ? { ...p, ...payload, basePrice: priceNum }
                                : p
                            )
                          );
                          setEditProduct(null);
                        } catch (er: any) {
                          toast.error(er?.message || "Update failed");
                        } finally {
                          setSavingProduct(false);
                        }
                      }}
                    >
                      {savingProduct ? "Saving…" : "Save"}
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
}

// Inline Add Product (Endpoint 19)
function AddProductInline({
  companyId,
  onAdded,
}: {
  companyId: number;
  onAdded: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const initial = {
    name: "",
    description: "",
    eyewearType: "GLASSES",
    frameType: "",
    material: "",
    basePrice: "",
    sku: "",
    barcode: "",
  };
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [statusMsg, setStatusMsg] = useState<string>("Ready");
  const validate = (draft = form) => {
    const errs: Record<string, string> = {};
    if (draft.name.trim().length < 2)
      errs.name = "Name must be at least 2 characters";
    const price = parseFloat(draft.basePrice);
    if (!draft.basePrice) errs.basePrice = "Base price required";
    else if (isNaN(price) || price <= 0)
      errs.basePrice = "Enter positive price";
    if (!draft.sku.trim()) errs.sku = "SKU required";
    if (!draft.barcode.trim()) errs.barcode = "Barcode required";
    return errs;
  };
  const valid = Object.keys(validate()).length === 0;
  const handleChange = (field: keyof typeof form, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors(validate({ ...form, [field]: value }));
  };
  const reset = () => {
    setForm(initial);
    setErrors({});
    setStatusMsg("Ready");
  };
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) {
          reset();
        } else {
          setTimeout(() => {
            try {
              (
                document.getElementById(
                  "add-prod-name"
                ) as HTMLInputElement | null
              )?.focus();
            } catch {}
          }, 15);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          Add Product
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Product</DialogTitle>
        </DialogHeader>
        <div
          className="space-y-3 text-sm max-h-[70vh] overflow-y-auto pr-1"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              (
                document.getElementById(
                  "add-prod-submit"
                ) as HTMLButtonElement | null
              )?.click();
            }
          }}
        >
          <div className="space-y-1">
            <Input
              id="add-prod-name"
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? "err-prod-name" : undefined}
              placeholder="Name"
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
            />
            {errors.name && (
              <p id="err-prod-name" className="text-xs text-red-600">
                {errors.name}
              </p>
            )}
          </div>
          <Input
            placeholder="Description (optional)"
            value={form.description}
            onChange={(e) => handleChange("description", e.target.value)}
          />
          <select
            className="border rounded-md p-2 w-full"
            value={form.eyewearType}
            onChange={(e) => handleChange("eyewearType", e.target.value)}
          >
            <option value="GLASSES">Glasses</option>
            <option value="SUNGLASSES">Sunglasses</option>
            <option value="LENSES">Lenses</option>
          </select>
          <Input
            placeholder="Frame Type (optional)"
            value={form.frameType}
            onChange={(e) => handleChange("frameType", e.target.value)}
          />
          <Input
            placeholder="Material (optional)"
            value={form.material}
            onChange={(e) => handleChange("material", e.target.value)}
          />
          <div className="space-y-1">
            <Input
              placeholder="Base Price"
              inputMode="decimal"
              type="number"
              value={form.basePrice}
              onChange={(e) => handleChange("basePrice", e.target.value)}
            />
            {errors.basePrice && (
              <p className="text-xs text-red-600">{errors.basePrice}</p>
            )}
          </div>
          <div className="space-y-1">
            <Input
              placeholder="SKU"
              value={form.sku}
              onChange={(e) => handleChange("sku", e.target.value)}
            />
            {errors.sku && <p className="text-xs text-red-600">{errors.sku}</p>}
          </div>
          <div className="space-y-1">
            <Input
              placeholder="Barcode"
              value={form.barcode}
              onChange={(e) => handleChange("barcode", e.target.value)}
            />
            {errors.barcode && (
              <p className="text-xs text-red-600">{errors.barcode}</p>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button
              variant="outline"
              type="button"
              onClick={() => {
                setOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button
              id="add-prod-submit"
              disabled={!valid || saving}
              onClick={async () => {
                const errs = validate();
                setErrors(errs);
                if (Object.keys(errs).length) {
                  setStatusMsg("Validation errors");
                  return;
                }
                if (saving) return;
                const price = parseFloat(form.basePrice);
                if (isNaN(price) || price <= 0) {
                  setErrors({ ...errs, basePrice: "Enter positive price" });
                  return;
                }
                try {
                  setSaving(true);
                  setStatusMsg("Saving");
                  await RetailerAPI.inventory.addProduct({
                    name: form.name.trim(),
                    description: form.description || undefined,
                    companyId,
                    eyewearType: form.eyewearType as any,
                    frameType: form.frameType || undefined,
                    material: form.material || undefined,
                    basePrice: price,
                    sku: form.sku.trim(),
                    barcode: form.barcode.trim(),
                  });
                  toast.success("Product added");
                  setStatusMsg("Saved");
                  onAdded();
                  setOpen(false);
                } catch (e: any) {
                  const msg = e?.message || "Add failed";
                  toast.error(msg);
                  setStatusMsg(msg);
                } finally {
                  setSaving(false);
                }
              }}
            >
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
          <div aria-live="polite" className="sr-only">
            {statusMsg}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Add Retailer Product Form (Endpoint: POST /inventory/my-products)
function RetailerAddProductForm({
  existing,
  onCancel,
  onAdded,
}: {
  existing: (string | undefined)[];
  onCancel: () => void;
  onAdded: (p: any) => void;
}) {
  const [step, setStep] = useState<"select" | "price">("select");
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<any | null>(null);
  const [wholesale, setWholesale] = useState("");
  const [retail, setRetail] = useState("");
  const [status, setStatus] = useState("Ready");
  const [error, setError] = useState<string | null>(null);

  const fetchBaseProducts = async () => {
    try {
      setLoading(true);
      // reuse companies products call? We'll just pull first company pages quickly if selected not required; minimal approach: search not implemented backend -> simulate empty
      // For now, rely on user knowing productId previously created (fallback) if no products fetched.
      // Improvement placeholder: integrate real searchable endpoint when available.
      setProducts([]);
    } catch (e: any) {
      setError(e?.message || "Load failed");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchBaseProducts();
  }, []);

  const duplicate =
    selected?.name && existing.includes(selected.name.toLowerCase());
  const proceedSelect = () => {
    if (selected && !duplicate) setStep("price");
  };
  const save = async () => {
    if (!selected) return;
    const ws = parseFloat(wholesale);
    const rp = parseFloat(retail);
    if (!(ws > 0) || !(rp > 0)) {
      setError("Enter positive prices");
      return;
    }
    if (rp < ws) {
      setError("Retail must be >= wholesale");
      return;
    }
    try {
      setLoading(true);
      setStatus("Saving");
      setError(null);
      const created: any = await RetailerAPI.inventory.addRetailerProduct({
        productId: selected.id,
        wholesalePrice: ws,
        retailPrice: rp,
      });
      toast.success("Retailer product added");
      onAdded({
        id: created?.id ?? Math.random(),
        product: {
          name: selected.name,
          company: { name: selected.company?.name },
        },
        wholesalePrice: ws,
        retailPrice: rp,
        availableStock: 0,
        allocatedStock: 0,
        totalStock: 0,
        stockStatus: "NEW",
      });
    } catch (e: any) {
      setError(e?.message || "Add failed");
      setStatus("Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 text-sm" aria-live="polite">
      {step === "select" && (
        <div className="space-y-3">
          <Input
            placeholder="(Optional) Filter local list"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {loading ? (
            <Skeleton className="h-16 w-full" />
          ) : error ? (
            <p className="text-xs text-red-600">{error}</p>
          ) : (
            <div className="border rounded max-h-52 overflow-y-auto divide-y">
              {products
                .filter(
                  (p) =>
                    !search ||
                    p.name.toLowerCase().includes(search.toLowerCase())
                )
                .slice(0, 25)
                .map((p) => (
                  <button
                    type="button"
                    key={p.id}
                    onClick={() => setSelected(p)}
                    className={`flex w-full items-center justify-between px-2 py-1 text-left hover:bg-muted/50 ${
                      selected?.id === p.id ? "bg-muted" : ""
                    }`}
                  >
                    <span className="truncate">{p.name}</span>
                    <span className="text-[10px] text-muted-foreground ml-2">
                      {p.company?.name}
                    </span>
                  </button>
                ))}
              {products.length === 0 && (
                <div className="p-2 text-xs text-muted-foreground">
                  No base products loaded (create one under Companies Products
                  first).
                </div>
              )}
            </div>
          )}
          {selected && (
            <div className="flex items-center justify-between text-xs">
              <span className="truncate">Selected: {selected.name}</span>
              {duplicate && (
                <span className="text-red-600">Duplicate already added</span>
              )}
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" type="button" onClick={onCancel}>
              Cancel
            </Button>
            <Button disabled={!selected || duplicate} onClick={proceedSelect}>
              Next
            </Button>
          </div>
        </div>
      )}
      {step === "price" && (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Set pricing for{" "}
            <span className="font-medium">{selected?.name}</span>
          </p>
          <Input
            placeholder="Wholesale Price"
            type="number"
            value={wholesale}
            onChange={(e) => setWholesale(e.target.value)}
          />
          <Input
            placeholder="Retail Price"
            type="number"
            value={retail}
            onChange={(e) => setRetail(e.target.value)}
          />
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex justify-between gap-2">
            <Button
              variant="outline"
              type="button"
              onClick={() => {
                setStep("select");
                setError(null);
              }}
            >
              Back
            </Button>
            <Button disabled={loading} onClick={save}>
              {loading ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>
      )}
      <div className="sr-only">{status}</div>
    </div>
  );
}
