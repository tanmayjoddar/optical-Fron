import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ShopAdminAPI } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  RefreshCcw,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";

interface StockReceipt {
  id: number;
  shopId: number;
  productId: number;
  quantity: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
  verifiedQuantity?: number;
  adminNotes?: string;
  discrepancyReason?: string;
  createdAt: string;
  verifiedAt?: string;
  product?: { id: number; name: string; sku: string; basePrice: number };
  receivedByStaff?: { id: number; name: string };
  verifiedByAdmin?: { id: number; name: string };
}

interface VerifyDialogState {
  open: boolean;
  receipt: StockReceipt | null;
  decision: "APPROVED" | "REJECTED" | null;
  verifiedQuantity: string;
  adminNotes: string;
  discrepancyReason: string;
  submitting: boolean;
}

const statusConfig = {
  PENDING: {
    color: "bg-yellow-100 text-yellow-800",
    icon: Clock,
    label: "Pending",
  },
  APPROVED: {
    color: "bg-green-100 text-green-800",
    icon: CheckCircle,
    label: "Approved",
  },
  REJECTED: {
    color: "bg-red-100 text-red-800",
    icon: XCircle,
    label: "Rejected",
  },
};

const pageSizeOptions = [10, 20, 50];
type SortKey = "createdAt" | "status" | "quantity";

// Helper function to safely get staff name
const getStaffName = (staff: unknown): string => {
  if (!staff) return "—";
  const staffObj = staff as { name?: string; id?: number };
  return staffObj?.name || `Staff #${staffObj?.id || "?"}` || "—";
};

// Helper function to safely get admin name
const getAdminName = (admin: unknown): string => {
  if (!admin) return "—";
  const adminObj = admin as { name?: string; id?: number };
  return adminObj?.name || `Admin #${adminObj?.id || "?"}` || "—";
};

const StockReceipts: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [receipts, setReceipts] = useState<StockReceipt[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "PENDING" | "APPROVED" | "REJECTED"
  >("ALL");
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [verifyDialog, setVerifyDialog] = useState<VerifyDialogState>({
    open: false,
    receipt: null,
    decision: null,
    verifiedQuantity: "",
    adminNotes: "",
    discrepancyReason: "",
    submitting: false,
  });

  const [summary, setSummary] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
  });

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const fetchReceipts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params: Record<string, unknown> = {
        page,
        limit,
        sortBy: sortKey,
        sortOrder: sortDir,
      };

      // Include status filter in API call if not "ALL"
      if (statusFilter !== "ALL") {
        params.status = statusFilter;
      }

      const res = await ShopAdminAPI.stock.getReceipts(
        params as Parameters<typeof ShopAdminAPI.stock.getReceipts>[0]
      );

      console.log("📦 Stock Receipts API Response:", res); // Debug log

      const list = res?.receipts || [];
      setReceipts(list);
      setTotal(res?.pagination?.totalItems || list.length);
      setSummary(res?.summary || { pending: 0, approved: 0, rejected: 0 });
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      const errorMsg =
        error?.response?.data?.message || "Failed to load stock receipts";
      console.error("❌ Error loading receipts:", errorMsg, err);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [page, limit, sortKey, sortDir, statusFilter]);

  useEffect(() => {
    fetchReceipts();
  }, [fetchReceipts]);

  // Use receipts directly from API (already filtered server-side)
  const filteredReceipts = useMemo(() => {
    return receipts;
  }, [receipts]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const openVerifyDialog = (receipt: StockReceipt) => {
    setVerifyDialog({
      open: true,
      receipt,
      decision: null,
      verifiedQuantity: String(receipt.quantity),
      adminNotes: "",
      discrepancyReason: "",
      submitting: false,
    });
  };

  const closeVerifyDialog = () => {
    setVerifyDialog({
      open: false,
      receipt: null,
      decision: null,
      verifiedQuantity: "",
      adminNotes: "",
      discrepancyReason: "",
      submitting: false,
    });
  };

  const submitVerification = async () => {
    if (!verifyDialog.receipt || !verifyDialog.decision) return;

    try {
      setVerifyDialog((prev) => ({ ...prev, submitting: true }));
      const payload: Parameters<typeof ShopAdminAPI.stock.verifyReceipt>[1] = {
        decision: verifyDialog.decision,
        verifiedQuantity:
          verifyDialog.decision === "APPROVED"
            ? Number(verifyDialog.verifiedQuantity)
            : undefined,
        adminNotes: verifyDialog.adminNotes || undefined,
        discrepancyReason:
          verifyDialog.decision === "REJECTED"
            ? verifyDialog.discrepancyReason
            : undefined,
      };

      const response = await ShopAdminAPI.stock.verifyReceipt(
        verifyDialog.receipt.id,
        payload
      );

      console.log("✅ Verification Response:", response); // Debug log

      // Show success message from API if available
      if (response?.message) {
        console.log("📢 API Message:", response.message);
      }

      await fetchReceipts();
      closeVerifyDialog();
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { message?: string; error?: string } };
      };
      const errorMsg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Failed to verify receipt";
      console.error("❌ Verification Error:", errorMsg, err);
      setError(errorMsg);
    } finally {
      setVerifyDialog((prev) => ({ ...prev, submitting: false }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Stock Receipts</h1>
          <p className="text-muted-foreground text-sm">
            Manage incoming stock and verify receipts
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => fetchReceipts()}
          disabled={loading}
        >
          <RefreshCcw className="h-4 w-4 mr-1" /> Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 space-y-2">
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <Clock className="h-4 w-4 text-yellow-600" /> Pending
          </div>
          <div className="text-2xl font-bold">{summary.pending}</div>
        </Card>
        <Card className="p-4 space-y-2">
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" /> Approved
          </div>
          <div className="text-2xl font-bold">{summary.approved}</div>
        </Card>
        <Card className="p-4 space-y-2">
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <XCircle className="h-4 w-4 text-red-600" /> Rejected
          </div>
          <div className="text-2xl font-bold">{summary.rejected}</div>
        </Card>
      </div>

      {/* Filters and Controls */}
      <Card className="p-4 space-y-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Status:</span>
            <select
              className="border rounded-md px-3 py-1 text-sm bg-background"
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(
                  e.target.value as "PENDING" | "APPROVED" | "REJECTED" | "ALL"
                )
              }
            >
              <option value="ALL">All</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-xs text-muted-foreground">Page Size:</span>
            <select
              className="border rounded-md px-2 py-1 text-sm bg-background"
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
            >
              {pageSizeOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
        <Separator />
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          {loading ? (
            <Skeleton className="h-48 w-full" />
          ) : filteredReceipts.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              No receipts found.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground text-left border-b">
                  <th
                    className="py-3 px-4 cursor-pointer"
                    onClick={() => toggleSort("createdAt")}
                  >
                    Date <ArrowUpDown className="inline h-3 w-3 ml-1" />
                  </th>
                  <th className="py-3 px-4">Product</th>
                  <th
                    className="py-3 px-4 cursor-pointer"
                    onClick={() => toggleSort("quantity")}
                  >
                    Qty <ArrowUpDown className="inline h-3 w-3 ml-1" />
                  </th>
                  <th className="py-3 px-4">Received By</th>
                  <th
                    className="py-3 px-4 cursor-pointer"
                    onClick={() => toggleSort("status")}
                  >
                    Status <ArrowUpDown className="inline h-3 w-3 ml-1" />
                  </th>
                  <th className="py-3 px-4">Verified By</th>
                  <th className="py-3 px-4">Notes</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredReceipts.map((receipt) => {
                  const config = statusConfig[receipt.status];
                  const StatusIcon = config.icon;
                  return (
                    <tr key={receipt.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4 text-xs whitespace-nowrap">
                        {new Date(receipt.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-sm">
                          {receipt.product?.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {receipt.product?.sku}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm font-medium">
                        {receipt.quantity}
                        {receipt.status === "APPROVED" &&
                          receipt.verifiedQuantity && (
                            <div className="text-xs text-muted-foreground">
                              ✓ {receipt.verifiedQuantity}
                            </div>
                          )}
                      </td>
                      <td className="py-3 px-4 text-xs">
                        {getStaffName(receipt.receivedByStaff)}
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={config.color}>
                          <StatusIcon className="h-3 w-3 mr-1" /> {config.label}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-xs">
                        {receipt.status !== "PENDING" ? (
                          <div className="space-y-1">
                            <div>{getAdminName(receipt.verifiedByAdmin)}</div>
                            {receipt.verifiedAt && (
                              <div className="text-muted-foreground">
                                {new Date(
                                  receipt.verifiedAt
                                ).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="py-3 px-4 text-xs text-muted-foreground max-w-xs truncate">
                        {receipt.adminNotes || receipt.discrepancyReason || "—"}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {receipt.status === "PENDING" && (
                          <Button
                            size="sm"
                            onClick={() => openVerifyDialog(receipt)}
                          >
                            Verify
                          </Button>
                        )}
                        {receipt.status !== "PENDING" && (
                          <span className="text-xs text-muted-foreground">
                            Done
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Mobile Cards */}
        <div className="grid gap-3 md:hidden">
          {loading ? (
            <Skeleton className="h-48 w-full" />
          ) : filteredReceipts.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              No receipts found.
            </div>
          ) : (
            filteredReceipts.map((receipt) => {
              const config = statusConfig[receipt.status];
              const StatusIcon = config.icon;
              return (
                <Card key={receipt.id} className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium text-sm">
                        {receipt.product?.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        SKU: {receipt.product?.sku}
                      </div>
                    </div>
                    <Badge className={config.color}>
                      <StatusIcon className="h-3 w-3 mr-1" /> {config.label}
                    </Badge>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-muted-foreground block mb-1">
                        Quantity
                      </span>
                      <span className="font-medium">{receipt.quantity}</span>
                      {receipt.status === "APPROVED" &&
                        receipt.verifiedQuantity && (
                          <div className="text-muted-foreground">
                            ✓ {receipt.verifiedQuantity}
                          </div>
                        )}
                    </div>
                    <div>
                      <span className="text-muted-foreground block mb-1">
                        Created
                      </span>
                      {new Date(receipt.createdAt).toLocaleDateString()}
                    </div>
                    <div className="col-span-2">
                      <span className="text-muted-foreground block mb-1">
                        Received By
                      </span>
                      {getStaffName(receipt.receivedByStaff)}
                    </div>
                    {receipt.status !== "PENDING" && (
                      <div className="col-span-2">
                        <span className="text-muted-foreground block mb-1">
                          Verified By
                        </span>
                        <div className="space-y-1">
                          <div>{getAdminName(receipt.verifiedByAdmin)}</div>
                          {receipt.verifiedAt && (
                            <div className="text-muted-foreground text-xs">
                              {new Date(
                                receipt.verifiedAt
                              ).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  {(receipt.adminNotes || receipt.discrepancyReason) && (
                    <div className="text-xs bg-muted p-2 rounded">
                      <span className="text-muted-foreground block mb-1 font-medium">
                        Notes
                      </span>
                      {receipt.adminNotes || receipt.discrepancyReason}
                    </div>
                  )}
                  {receipt.status === "PENDING" && (
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => openVerifyDialog(receipt)}
                    >
                      Verify Receipt
                    </Button>
                  )}
                </Card>
              );
            })
          )}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between pt-2 text-sm">
          <div>
            Page {page} of {totalPages}
          </div>
          <div className="flex gap-2 items-center">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex gap-1">
              {Array.from({ length: totalPages })
                .slice(0, 7)
                .map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i + 1)}
                    className={`px-2 py-1 rounded text-xs ${
                      page === i + 1
                        ? "bg-primary text-white"
                        : "bg-muted hover:bg-muted/70"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              {totalPages > 7 && <span className="text-xs px-1">…</span>}
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Verify Dialog */}
      <Dialog open={verifyDialog.open} onOpenChange={closeVerifyDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Verify Stock Receipt</DialogTitle>
            <DialogDescription>
              Product: {verifyDialog.receipt?.product?.name} | Qty:{" "}
              {verifyDialog.receipt?.quantity}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex gap-2">
              <Button
                variant={
                  verifyDialog.decision === "APPROVED" ? "default" : "outline"
                }
                className="flex-1"
                onClick={() =>
                  setVerifyDialog((prev) => ({ ...prev, decision: "APPROVED" }))
                }
              >
                <CheckCircle className="h-4 w-4 mr-2" /> Approve
              </Button>
              <Button
                variant={
                  verifyDialog.decision === "REJECTED"
                    ? "destructive"
                    : "outline"
                }
                className="flex-1"
                onClick={() =>
                  setVerifyDialog((prev) => ({ ...prev, decision: "REJECTED" }))
                }
              >
                <XCircle className="h-4 w-4 mr-2" /> Reject
              </Button>
            </div>

            {verifyDialog.decision === "APPROVED" && (
              <div className="space-y-2">
                <label className="text-xs font-medium">Verified Quantity</label>
                <Input
                  type="number"
                  value={verifyDialog.verifiedQuantity}
                  onChange={(e) =>
                    setVerifyDialog((prev) => ({
                      ...prev,
                      verifiedQuantity: e.target.value,
                    }))
                  }
                />
              </div>
            )}

            {verifyDialog.decision === "REJECTED" && (
              <div className="space-y-2">
                <label className="text-xs font-medium">
                  Discrepancy Reason
                </label>
                <select
                  className="w-full border rounded-md px-3 py-2 text-sm"
                  value={verifyDialog.discrepancyReason}
                  onChange={(e) =>
                    setVerifyDialog((prev) => ({
                      ...prev,
                      discrepancyReason: e.target.value,
                    }))
                  }
                >
                  <option value="">Select reason...</option>
                  <option value="DAMAGED_GOODS">Damaged Goods</option>
                  <option value="QUANTITY_MISMATCH">Quantity Mismatch</option>
                  <option value="DEFECTIVE_ITEMS">Defective Items</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-medium">Admin Notes</label>
              <textarea
                className="w-full border rounded-md px-3 py-2 text-sm"
                rows={3}
                placeholder="Add notes about this receipt..."
                value={verifyDialog.adminNotes}
                onChange={(e) =>
                  setVerifyDialog((prev) => ({
                    ...prev,
                    adminNotes: e.target.value,
                  }))
                }
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={closeVerifyDialog}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={submitVerification}
                disabled={!verifyDialog.decision || verifyDialog.submitting}
                className="flex-1"
              >
                {verifyDialog.submitting ? "Submitting..." : "Submit"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StockReceipts;
