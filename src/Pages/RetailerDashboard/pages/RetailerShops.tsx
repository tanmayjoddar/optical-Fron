import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { useQuerySync } from "@/hooks/useQuerySync";
import type { RetailerShopRecord } from "@/lib/types/retailer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RetailerAPI } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { TablePagination } from "@/components/ui/table-pagination";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DiscoverShops from "@/components/retailer/DiscoverShops";
import NetworkAnalytics from "@/components/retailer/NetworkAnalytics";
import { toast } from "sonner";

export default function RetailerShops() {
  const navigate = useNavigate();
  useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  type ShopStats = {
    totalDistributions?: number;
    pendingPayments?: number;
    totalQuantityDistributed?: number;
    totalAmountDistributed?: number;
  };
  type ShopRow = RetailerShopRecord & {
    shop?: { name?: string; address?: string } | null;
    stats?: ShopStats | null;
  };
  type Performance = {
    totalShops?: number;
    topPerformingShop?: { name?: string; revenue?: number } | null;
    averageRevenuePerShop?: number;
  };
  const [shops, setShops] = useState<ShopRow[]>([]);
  const [performance, setPerformance] = useState<Performance | null>(null);
  // Filters & pagination (API spec supports page/limit/isActive/partnershipType; fallback to client slice as response lacks pagination)
  const [search, setSearch] = useState("");
  const [isActiveFilter, setIsActiveFilter] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [partnershipTypeFilter, setPartnershipTypeFilter] = useState<
    "" | "DEALER" | "FRANCHISE" | "DISTRIBUTOR"
  >("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [refreshing, setRefreshing] = useState(false);
  const [statusMsg, setStatusMsg] = useState("Loading shops…");
  // Add shop dialog state
  const [addOpen, setAddOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [addForm, setAddForm] = useState({
    shopId: "",
    partnershipType: "DEALER",
    commissionRate: "",
    creditLimit: "",
    paymentTerms: "NET_30",
  });
  const [addErrors, setAddErrors] = useState<string[]>([]);
  // Edit partnership dialog state
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<{
    id?: number;
    partnershipType: string;
    commissionRate: string;
    creditLimit: string;
    isActive: boolean;
  }>({
    partnershipType: "DEALER",
    commissionRate: "",
    creditLimit: "",
    isActive: true,
  });
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailShop, setDetailShop] = useState<ShopRow | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setStatusMsg("Loading shops…");
      setLoading(true);
      setError(null);
      const [rawShops, perfResp] = await Promise.all([
        RetailerAPI.shops.getAll({
          // Pass filters server-side when available
          isActive:
            isActiveFilter === "all" ? undefined : isActiveFilter === "active",
          partnershipType: partnershipTypeFilter || undefined,
          search: search || undefined,
          page,
          limit,
        }),
        RetailerAPI.dashboard.shopPerformance({ period: "month" }),
      ]);
      setShops(rawShops || []);
      const perfData: Performance = {
        totalShops: rawShops?.length || 0,
        topPerformingShop: (() => {
          const arr = perfResp?.shopPerformance || [];
          if (!Array.isArray(arr) || arr.length === 0) return null;
          const top = [...arr].sort(
            (a, b) => (b.totalAmount || 0) - (a.totalAmount || 0)
          )[0];
          return { name: top.shopName, revenue: top.totalAmount };
        })(),
        averageRevenuePerShop: (() => {
          const arr = perfResp?.shopPerformance || [];
          if (!Array.isArray(arr) || arr.length === 0) return 0;
          const total = arr.reduce(
            (a: number, b: { totalAmount?: number }) =>
              a + (b.totalAmount || 0),
            0
          );
          return total / arr.length;
        })(),
      };
      setPerformance(perfData);
      setStatusMsg(`${rawShops?.length || 0} shops loaded`);
    } catch (e) {
      const message =
        typeof e === "object" && e && "message" in e
          ? String((e as { message?: unknown }).message)
          : undefined;
      setError(message || "Failed to load shops");
      setStatusMsg("Error loading shops");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isActiveFilter, partnershipTypeFilter, search, page, limit]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Unified URL sync using hook
  useQuerySync<{
    search?: string;
    active?: string;
    partner?: string;
    page?: string;
    limit?: string;
  }>({
    state: {
      search,
      active: isActiveFilter === "all" ? undefined : isActiveFilter,
      partner: partnershipTypeFilter || undefined,
      page: page !== 1 ? String(page) : undefined,
      limit: limit !== 10 ? String(limit) : undefined,
    },
    // Apply updates by diffing keys
    setState: (updater) => {
      const next = updater({
        search,
        active: isActiveFilter === "all" ? undefined : isActiveFilter,
        partner: partnershipTypeFilter || undefined,
        page: page !== 1 ? String(page) : undefined,
        limit: limit !== 10 ? String(limit) : undefined,
      });
      if (next.search !== search) setSearch(next.search || "");
      if ((next.active || "all") !== isActiveFilter)
        setIsActiveFilter(
          (next.active as "all" | "active" | "inactive") || "all"
        );
      if ((next.partner || "") !== partnershipTypeFilter)
        setPartnershipTypeFilter(
          (next.partner as "" | "DEALER" | "FRANCHISE" | "DISTRIBUTOR") || ""
        );
      if (next.page && parseInt(next.page, 10) !== page)
        setPage(parseInt(next.page, 10));
      else if (!next.page && page !== 1) setPage(1);
      if (next.limit && parseInt(next.limit, 10) !== limit)
        setLimit(parseInt(next.limit, 10));
      else if (!next.limit && limit !== 10) setLimit(10);
    },
    keys: ["search", "active", "partner", "page", "limit"],
    onExternalChange: () => {
      setTimeout(() => loadData(), 0);
    },
  });

  // Client-side filtering fallback (if API ignored filters)
  const filtered = useMemo(() => {
    let data = [...shops];
    if (isActiveFilter !== "all")
      data = data.filter((s) => s.isActive === (isActiveFilter === "active"));
    if (partnershipTypeFilter)
      data = data.filter((s) => s.partnershipType === partnershipTypeFilter);
    if (search) {
      const q = search.toLowerCase();
      data = data.filter((s) => s.shop?.name?.toLowerCase().includes(q));
    }
    return data;
  }, [shops, isActiveFilter, partnershipTypeFilter, search]);

  // Client pagination fallback if backend doesn't paginate
  const paginated = useMemo(() => {
    if (shops.length <= limit) return filtered; // likely already filtered server-side
    const start = (page - 1) * limit;
    return filtered.slice(start, start + limit);
  }, [filtered, page, limit, shops.length]);

  const totalPages = useMemo(() => {
    if (shops.length <= limit) return page; // if server handled pagination, keep current page
    return Math.max(1, Math.ceil(filtered.length / limit));
  }, [filtered.length, limit, page, shops.length]);

  const refresh = async () => {
    setRefreshing(true);
    await loadData();
  };

  // Optimistic stats adjustment when a new distribution is created (Task33)
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as Record<string, unknown>;
      if (!detail?.shopId || !Array.isArray(detail.lines)) return;
      setShops((prev) =>
        prev.map((s) => {
          if ((s.id || s.shopId) === (detail.shopId as number)) {
            const addedQty = (
              detail.lines as Array<{ quantity?: number }>
            ).reduce(
              (a: number, l: { quantity?: number }) => a + (l.quantity || 0),
              0
            );
            const addedValue = (
              detail.lines as Array<{ quantity?: number; unitPrice?: number }>
            ).reduce(
              (a: number, l: { quantity?: number; unitPrice?: number }) =>
                a + (l.quantity || 0) * (l.unitPrice || 0),
              0
            );
            const existingStats = s.stats || {};
            return {
              ...s,
              stats: {
                ...existingStats,
                totalDistributions: (existingStats.totalDistributions || 0) + 1,
                totalQuantityDistributed:
                  (existingStats.totalQuantityDistributed || 0) + addedQty,
                totalAmountDistributed:
                  (existingStats.totalAmountDistributed || 0) + addedValue,
                // pendingPayments left unchanged (requires backend recompute)
              },
            };
          }
          return s;
        })
      );
    };
    window.addEventListener(
      "retailer:distribution-created",
      handler as EventListener
    );
    return () =>
      window.removeEventListener(
        "retailer:distribution-created",
        handler as EventListener
      );
  }, []);

  const renderSkeletonTable = (
    <div className="border rounded-md overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-muted/40">
          <tr>
            {[
              "Shop",
              "Address",
              "Partnership",
              "Commission",
              "Credit Limit",
              "Active",
              "Stats",
              "Actions",
            ].map((h) => (
              <th
                key={h}
                className="text-left px-3 py-2 font-medium text-xs uppercase tracking-wide"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: limit }).map((_, i) => (
            <tr key={i} className="border-t">
              <td className="px-3 py-3">
                <Skeleton className="h-4 w-32" />
              </td>
              <td className="px-3 py-3">
                <Skeleton className="h-4 w-40" />
              </td>
              <td className="px-3 py-3">
                <Skeleton className="h-4 w-20" />
              </td>
              <td className="px-3 py-3">
                <Skeleton className="h-4 w-12" />
              </td>
              <td className="px-3 py-3">
                <Skeleton className="h-4 w-16" />
              </td>
              <td className="px-3 py-3">
                <Skeleton className="h-4 w-10" />
              </td>
              <td className="px-3 py-3">
                <Skeleton className="h-4 w-24" />
              </td>
              <td className="px-3 py-3">
                <Skeleton className="h-7 w-14" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  // Small reusable pagination component (Task29 groundwork)
  // (Removed local TablePagination in favor of shared component)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-brand-gradient">
          Shops & Network
        </h2>
        <p className="text-muted-foreground">
          Manage shop network and view analytics
        </p>
      </div>

      <Tabs defaultValue="my-shops" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="my-shops">My Shops</TabsTrigger>
          <TabsTrigger value="discover">Discover Shops</TabsTrigger>
          <TabsTrigger value="analytics">Network Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="my-shops" className="space-y-4">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium">Search</label>
                <Input
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Search shop name"
                  className="w-48"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium">Active</label>
                <select
                  className="border rounded-md text-sm px-2 py-1 h-9"
                  value={isActiveFilter}
                  onChange={(e) => {
                    setIsActiveFilter(
                      e.target.value as "all" | "active" | "inactive"
                    );
                    setPage(1);
                  }}
                >
                  <option value="all">All</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium">Partnership</label>
                <select
                  className="border rounded-md text-sm px-2 py-1 h-9"
                  value={partnershipTypeFilter}
                  onChange={(e) => {
                    setPartnershipTypeFilter(
                      e.target.value as
                        | ""
                        | "DEALER"
                        | "FRANCHISE"
                        | "DISTRIBUTOR"
                    );
                    setPage(1);
                  }}
                >
                  <option value="">All</option>
                  {["DEALER", "FRANCHISE", "DISTRIBUTOR"].map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium">Page Size</label>
                <select
                  className="border rounded-md text-sm px-2 py-1 h-9"
                  value={limit}
                  onChange={(e) => {
                    setLimit(parseInt(e.target.value, 10));
                    setPage(1);
                  }}
                >
                  {[10, 20, 30, 50].map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={refreshing || loading}
                  onClick={refresh}
                >
                  {refreshing ? "Refreshing…" : "Refresh"}
                </Button>
                <Dialog
                  open={addOpen}
                  onOpenChange={(o) => {
                    setAddOpen(o);
                    if (!o)
                      setAddForm({
                        shopId: "",
                        partnershipType: "DEALER",
                        commissionRate: "",
                        creditLimit: "",
                        paymentTerms: "NET_30",
                      });
                  }}
                >
                  <DialogTrigger asChild>
                    <Button size="sm" variant="default">
                      Add Shop
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Shop to Network</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 text-sm">
                      <div>
                        <label className="block text-xs mb-1">Shop ID</label>
                        <Input
                          value={addForm.shopId}
                          onChange={(e) =>
                            setAddForm((f) => ({
                              ...f,
                              shopId: e.target.value,
                            }))
                          }
                          placeholder="Numeric ID"
                        />
                      </div>
                      <div>
                        <label className="block text-xs mb-1">
                          Partnership Type
                        </label>
                        <select
                          className="w-full border rounded-md p-2"
                          value={addForm.partnershipType}
                          onChange={(e) =>
                            setAddForm((f) => ({
                              ...f,
                              partnershipType: e.target.value,
                            }))
                          }
                        >
                          {["DEALER", "FRANCHISE", "DISTRIBUTOR"].map((p) => (
                            <option key={p} value={p}>
                              {p}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs mb-1">
                            Commission Rate (%)
                          </label>
                          <Input
                            type="number"
                            value={addForm.commissionRate}
                            onChange={(e) =>
                              setAddForm((f) => ({
                                ...f,
                                commissionRate: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div>
                          <label className="block text-xs mb-1">
                            Credit Limit
                          </label>
                          <Input
                            type="number"
                            value={addForm.creditLimit}
                            onChange={(e) =>
                              setAddForm((f) => ({
                                ...f,
                                creditLimit: e.target.value,
                              }))
                            }
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs mb-1">
                          Payment Terms
                        </label>
                        <select
                          className="w-full border rounded-md p-2"
                          value={addForm.paymentTerms}
                          onChange={(e) =>
                            setAddForm((f) => ({
                              ...f,
                              paymentTerms: e.target.value,
                            }))
                          }
                        >
                          {["NET_15", "NET_30", "NET_45", "NET_60"].map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex justify-end gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setAddOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          disabled={adding}
                          onClick={async () => {
                            const errors: string[] = [];
                            const id = parseInt(addForm.shopId, 10);
                            if (!id || id <= 0)
                              errors.push("Valid numeric shop ID required");
                            if (!addForm.partnershipType)
                              errors.push("Partnership type required");
                            const commission = addForm.commissionRate
                              ? parseFloat(addForm.commissionRate)
                              : undefined;
                            if (
                              addForm.commissionRate &&
                              (isNaN(commission as number) ||
                                (commission as number) < 0 ||
                                (commission as number) > 100)
                            )
                              errors.push("Commission must be 0-100");
                            const credit = addForm.creditLimit
                              ? parseFloat(addForm.creditLimit)
                              : undefined;
                            if (
                              addForm.creditLimit &&
                              (isNaN(credit as number) ||
                                (credit as number) < 0)
                            )
                              errors.push("Credit limit must be positive");
                            if (!addForm.paymentTerms)
                              errors.push("Payment terms required");
                            if (shops.some((s) => s.id === id))
                              errors.push("Shop already exists in list");
                            setAddErrors(errors);
                            if (errors.length) return;
                            try {
                              setAdding(true);
                              const resp = await RetailerAPI.shops.add({
                                shopId: id,
                                partnershipType: addForm.partnershipType as
                                  | "FRANCHISE"
                                  | "DEALER"
                                  | "DISTRIBUTOR",
                                commissionRate: commission,
                                creditLimit: credit,
                                paymentTerms: addForm.paymentTerms,
                              });
                              // Optimistic prepend if on first page
                              if (page === 1 && resp?.retailerShop) {
                                setShops((prev) => [
                                  resp.retailerShop as RetailerShopRecord,
                                  ...prev,
                                ]);
                              }
                              toast.success("Shop added");
                              setAddOpen(false);
                              setAddForm({
                                shopId: "",
                                partnershipType: "DEALER",
                                commissionRate: "",
                                creditLimit: "",
                                paymentTerms: "NET_30",
                              });
                              setAddErrors([]);
                              // Background refresh to sync stats
                              refresh();
                            } catch (e) {
                              const errorMsg =
                                typeof e === "object" && e && "message" in e
                                  ? String(
                                      (e as Record<string, unknown>).message
                                    )
                                  : "Add failed";
                              toast.error(errorMsg);
                            } finally {
                              setAdding(false);
                            }
                          }}
                        >
                          {adding ? "Saving…" : "Save"}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
            <Separator />
          </div>
          <div aria-live="polite" className="sr-only">
            {statusMsg}
          </div>
          {addErrors.length > 0 && (
            <div className="text-xs text-red-600" aria-live="assertive">
              {addErrors.map((e) => (
                <div key={e}>{e}</div>
              ))}
            </div>
          )}
          <Dialog
            open={editOpen}
            onOpenChange={(o) => {
              setEditOpen(o);
              if (!o)
                setEditForm({
                  partnershipType: "DEALER",
                  commissionRate: "",
                  creditLimit: "",
                  isActive: true,
                });
            }}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Partnership</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs mb-1">
                      Partnership Type
                    </label>
                    <select
                      className="w-full border rounded-md p-2"
                      value={editForm.partnershipType}
                      onChange={(e) =>
                        setEditForm((f) => ({
                          ...f,
                          partnershipType: e.target.value,
                        }))
                      }
                    >
                      {["DEALER", "FRANCHISE", "DISTRIBUTOR"].map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-2 pt-5">
                    <input
                      id="isActive"
                      type="checkbox"
                      checked={editForm.isActive}
                      onChange={(e) =>
                        setEditForm((f) => ({
                          ...f,
                          isActive: e.target.checked,
                        }))
                      }
                    />
                    <label htmlFor="isActive" className="text-xs">
                      Active
                    </label>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs mb-1">
                      Commission Rate (%)
                    </label>
                    <Input
                      type="number"
                      value={editForm.commissionRate}
                      onChange={(e) =>
                        setEditForm((f) => ({
                          ...f,
                          commissionRate: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-xs mb-1">Credit Limit</label>
                    <Input
                      type="number"
                      value={editForm.creditLimit}
                      onChange={(e) =>
                        setEditForm((f) => ({
                          ...f,
                          creditLimit: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    disabled={editing}
                    onClick={async () => {
                      if (!editForm.id) return;
                      try {
                        setEditing(true);
                        await RetailerAPI.shops.updatePartnership(editForm.id, {
                          partnershipType: editForm.partnershipType,
                          commissionRate: editForm.commissionRate
                            ? parseFloat(editForm.commissionRate)
                            : undefined,
                          creditLimit: editForm.creditLimit
                            ? parseFloat(editForm.creditLimit)
                            : undefined,
                          isActive: editForm.isActive,
                        });
                        toast.success("Partnership updated");
                        setEditOpen(false);
                        try {
                          const data = await RetailerAPI.shops.getAll();
                          setShops(data as RetailerShopRecord[]);
                        } catch {
                          /* ignore */
                        }
                      } catch (e) {
                        const errorMsg =
                          typeof e === "object" && e && "message" in e
                            ? String((e as Record<string, unknown>).message)
                            : "Update failed";
                        toast.error(errorMsg);
                      } finally {
                        setEditing(false);
                      }
                    }}
                  >
                    {editing ? "Saving…" : "Save"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>
                {error}{" "}
                <Button
                  size="sm"
                  variant="outline"
                  className="ml-2"
                  onClick={refresh}
                >
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {performance && !error && (
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-brand-gradient">
                  Monthly Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="clay p-4 rounded-lg">
                    <div className="text-xs text-muted-foreground">
                      Total Shops
                    </div>
                    <div className="text-xl font-semibold">
                      {performance.totalShops}
                    </div>
                  </div>
                  <div className="clay p-4 rounded-lg">
                    <div className="text-xs text-muted-foreground">
                      Top Shop
                    </div>
                    <div className="text-xl font-semibold">
                      {performance.topPerformingShop?.name}
                    </div>
                  </div>
                  <div className="clay p-4 rounded-lg">
                    <div className="text-xs text-muted-foreground">
                      Top Revenue
                    </div>
                    <div className="text-xl font-semibold">
                      ₹
                      {performance.topPerformingShop?.revenue?.toLocaleString?.()}
                    </div>
                  </div>
                  <div className="clay p-4 rounded-lg">
                    <div className="text-xs text-muted-foreground">
                      Avg Revenue/Shop
                    </div>
                    <div className="text-xl font-semibold">
                      ₹{performance.averageRevenuePerShop?.toLocaleString?.()}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-4">
            {loading ? (
              renderSkeletonTable
            ) : (
              <div className="border rounded-md overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40">
                    <tr>
                      <th className="text-left px-3 py-2 font-medium text-xs uppercase tracking-wide">
                        Shop
                      </th>
                      <th className="text-left px-3 py-2 font-medium text-xs uppercase tracking-wide">
                        Address
                      </th>
                      <th className="text-left px-3 py-2 font-medium text-xs uppercase tracking-wide">
                        Partnership
                      </th>
                      <th className="text-left px-3 py-2 font-medium text-xs uppercase tracking-wide">
                        Commission %
                      </th>
                      <th className="text-left px-3 py-2 font-medium text-xs uppercase tracking-wide">
                        Credit Limit
                      </th>
                      <th className="text-left px-3 py-2 font-medium text-xs uppercase tracking-wide">
                        Active
                      </th>
                      <th className="text-left px-3 py-2 font-medium text-xs uppercase tracking-wide">
                        Stats
                      </th>
                      <th className="text-left px-3 py-2 font-medium text-xs uppercase tracking-wide">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {!loading && paginated.length === 0 && (
                      <tr>
                        <td
                          colSpan={8}
                          className="px-3 py-8 text-center text-sm text-muted-foreground"
                        >
                          No shops match filters.
                        </td>
                      </tr>
                    )}
                    {paginated.map((rs: ShopRow) => {
                      const partnership = rs.partnershipType || "-";
                      const commission = rs.commissionRate ?? "";
                      const creditLimit = rs.creditLimit ?? "";
                      const isActive = rs.isActive !== false;
                      return (
                        <tr key={rs.id} className="border-t hover:bg-muted/30">
                          <td className="px-3 py-2 font-medium whitespace-nowrap">
                            <button
                              className="underline-offset-2 hover:underline"
                              onClick={() => {
                                setDetailShop(rs);
                                setDetailOpen(true);
                                if (!rs.stats) {
                                  setDetailLoading(true);
                                  setTimeout(
                                    () => setDetailLoading(false),
                                    400
                                  );
                                }
                              }}
                            >
                              {rs.shop?.name || `#${rs.id}`}
                            </button>
                          </td>
                          <td className="px-3 py-2 font-medium whitespace-nowrap">
                            <button
                              className="text-xs text-blue-600 underline-offset-2 hover:underline"
                              onClick={() =>
                                navigate(
                                  `/retailer-dashboard/distributions?shopId=${
                                    rs.shopId || rs.id
                                  }`
                                )
                              }
                            >
                              View Dist.
                            </button>
                          </td>
                          <td
                            className="px-3 py-2 max-w-xs truncate"
                            title={rs.shop?.address}
                          >
                            {rs.shop?.address || "—"}
                          </td>
                          <td className="px-3 py-2">
                            <StatusBadge
                              status={partnership}
                              className="text-[10px] tracking-wide"
                            />
                          </td>
                          <td className="px-3 py-2">
                            {commission !== "" ? commission : "—"}
                          </td>
                          <td className="px-3 py-2">
                            {creditLimit !== ""
                              ? `₹${Number(creditLimit).toLocaleString()}`
                              : "—"}
                          </td>
                          <td className="px-3 py-2">
                            <StatusBadge
                              status={isActive ? "ACTIVE" : "INACTIVE"}
                            />
                          </td>
                          <td className="px-3 py-2 text-xs leading-tight">
                            <div className="flex flex-col gap-0.5">
                              <span>
                                D: {rs.stats?.totalDistributions ?? 0}
                              </span>
                              <span className="text-amber-600">
                                ₹
                                {rs.stats?.pendingPayments?.toLocaleString?.() ??
                                  0}
                              </span>
                              <span>
                                Q: {rs.stats?.totalQuantityDistributed ?? 0}
                              </span>
                            </div>
                          </td>
                          <td className="px-3 py-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setEditForm({
                                  id: rs.id,
                                  partnershipType:
                                    (rs.partnershipType as
                                      | "FRANCHISE"
                                      | "DEALER"
                                      | "DISTRIBUTOR") || "DEALER",
                                  commissionRate: String(
                                    rs.commissionRate ?? ""
                                  ),
                                  creditLimit: String(rs.creditLimit ?? ""),
                                  isActive: rs.isActive !== false,
                                });
                                setEditOpen(true);
                              }}
                            >
                              Edit
                              <span className="sr-only"> {rs.shop?.name}</span>
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            <TablePagination
              page={page}
              totalPages={totalPages}
              onPrev={() => setPage((p) => Math.max(1, p - 1))}
              onNext={() => setPage((p) => p + 1)}
              disablePrev={page === 1}
              disableNext={page >= totalPages}
              label="Shops pagination"
            />
          </div>
          <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
            <SheetContent side="right" className="sm:max-w-lg w-full">
              <SheetHeader>
                <SheetTitle>
                  {detailShop?.shop?.name ||
                    (detailShop && `Shop #${detailShop.id}`)}
                </SheetTitle>
                <SheetDescription>
                  {detailShop?.shop?.address || "No address available"}
                </SheetDescription>
              </SheetHeader>
              <div className="px-4 pb-6 space-y-4 text-sm overflow-y-auto">
                {detailLoading && (
                  <div className="text-muted-foreground">Loading details…</div>
                )}
                {!detailLoading && detailShop && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="clay p-3 rounded-lg">
                        <div className="text-[10px] uppercase text-muted-foreground">
                          Partnership
                        </div>
                        <div className="font-medium">
                          {detailShop?.partnershipType}
                        </div>
                      </div>
                      <div className="clay p-3 rounded-lg">
                        <div className="text-[10px] uppercase text-muted-foreground">
                          Status
                        </div>
                        <div>
                          {detailShop?.isActive !== false
                            ? "Active"
                            : "Inactive"}
                        </div>
                      </div>
                      <div className="clay p-3 rounded-lg">
                        <div className="text-[10px] uppercase text-muted-foreground">
                          Commission %
                        </div>
                        <div>{detailShop?.commissionRate ?? "—"}</div>
                      </div>
                      <div className="clay p-3 rounded-lg">
                        <div className="text-[10px] uppercase text-muted-foreground">
                          Credit Limit
                        </div>
                        <div>
                          {detailShop?.creditLimit
                            ? `₹${Number(
                                detailShop?.creditLimit
                              ).toLocaleString()}`
                            : "—"}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="clay p-3 rounded-lg">
                        <div className="text-[10px] uppercase text-muted-foreground">
                          Distributions
                        </div>
                        <div>{detailShop.stats?.totalDistributions ?? 0}</div>
                      </div>
                      <div className="clay p-3 rounded-lg">
                        <div className="text-[10px] uppercase text-muted-foreground">
                          Pending Pay
                        </div>
                        <div>
                          ₹
                          {detailShop.stats?.pendingPayments?.toLocaleString?.() ??
                            0}
                        </div>
                      </div>
                      <div className="clay p-3 rounded-lg">
                        <div className="text-[10px] uppercase text-muted-foreground">
                          Quantity Dist.
                        </div>
                        <div>
                          {detailShop.stats?.totalQuantityDistributed ?? 0}
                        </div>
                      </div>
                      <div className="clay p-3 rounded-lg">
                        <div className="text-[10px] uppercase text-muted-foreground">
                          Amount Dist.
                        </div>
                        <div>
                          ₹
                          {detailShop.stats?.totalAmountDistributed?.toLocaleString?.() ??
                            0}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </TabsContent>

        <TabsContent value="discover">
          <DiscoverShops
            onShopsLoaded={() => {
              setTimeout(() => loadData(), 500);
            }}
          />
        </TabsContent>

        <TabsContent value="analytics">
          <NetworkAnalytics />
        </TabsContent>
      </Tabs>
    </div>
  );
}
