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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChevronLeft,
  ChevronRight,
  RefreshCcw,
  Package,
  AlertCircle,
  CheckCircle2,
  Truck,
} from "lucide-react";
import type {
  IncomingShipment,
  UpdateShipmentStatusRequest,
} from "@/lib/types/shopAdmin";

const statusConfig: Record<
  string,
  { bg: string; text: string; icon: React.ReactNode; label: string }
> = {
  EXPECTED: {
    bg: "bg-yellow-50",
    text: "text-yellow-700",
    icon: <Truck className="w-4 h-4" />,
    label: "Expected",
  },
  IN_TRANSIT: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    icon: <Truck className="w-4 h-4" />,
    label: "In Transit",
  },
  PARTIALLY_RECEIVED: {
    bg: "bg-orange-50",
    text: "text-orange-700",
    icon: <AlertCircle className="w-4 h-4" />,
    label: "Partially Received",
  },
  FULLY_RECEIVED: {
    bg: "bg-green-50",
    text: "text-green-700",
    icon: <CheckCircle2 className="w-4 h-4" />,
    label: "Fully Received",
  },
  OVERDUE: {
    bg: "bg-red-50",
    text: "text-red-700",
    icon: <AlertCircle className="w-4 h-4" />,
    label: "Overdue",
  },
  CANCELLED: {
    bg: "bg-gray-50",
    text: "text-gray-700",
    icon: <AlertCircle className="w-4 h-4" />,
    label: "Cancelled",
  },
};

interface UpdateShipmentState {
  open: boolean;
  shipment: IncomingShipment | null;
  newStatus: string;
  notes: string;
  receivedQuantity: string;
  discrepancyReason: string;
  submitting: boolean;
  error: string | null;
}

interface DetailSheetState {
  open: boolean;
  shipment: IncomingShipment | null;
  loading: boolean;
}

const IncomingShipments: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shipments, setShipments] = useState<IncomingShipment[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [refreshing, setRefreshing] = useState(false);
  const [detailSheet, setDetailSheet] = useState<DetailSheetState>({
    open: false,
    shipment: null,
    loading: false,
  });
  const [updateDialog, setUpdateDialog] = useState<UpdateShipmentState>({
    open: false,
    shipment: null,
    newStatus: "",
    notes: "",
    receivedQuantity: "",
    discrepancyReason: "",
    submitting: false,
    error: null,
  });

  // Fetch shipments
  const fetchShipments = useCallback(
    async (pageNum: number = 1) => {
      try {
        setLoading(true);
        setError(null);
        console.log("Fetching incoming shipments with filters:", {
          page: pageNum,
          limit,
          status: statusFilter === "ALL" ? undefined : statusFilter,
        });

        const response = await ShopAdminAPI.stock.incomingShipments.getAll({
          page: pageNum,
          limit,
          status:
            statusFilter === "ALL"
              ? undefined
              : (statusFilter as
                  | "EXPECTED"
                  | "IN_TRANSIT"
                  | "PARTIALLY_RECEIVED"
                  | "FULLY_RECEIVED"
                  | "OVERDUE"
                  | "CANCELLED"
                  | undefined),
        });

        console.log("Shipments response:", response);
        setShipments(response.shipments || []);
        setTotal(response.pagination?.totalItems || 0);
        setPage(pageNum);
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "Failed to load shipments";
        console.error("Error fetching shipments:", err);
        setError(errorMsg);
      } finally {
        setLoading(false);
      }
    },
    [limit, statusFilter]
  );

  // Fetch detail
  const fetchDetail = useCallback(async (id: number) => {
    try {
      setDetailSheet((prev) => ({ ...prev, loading: true }));
      console.log("Fetching shipment detail for ID:", id);
      const response = await ShopAdminAPI.stock.incomingShipments.getDetail(id);
      console.log("Detail response:", response);
      setDetailSheet((prev) => ({
        ...prev,
        shipment: response.shipment || null,
        loading: false,
      }));
    } catch (err) {
      console.error("Error fetching detail:", err);
      setDetailSheet((prev) => ({
        ...prev,
        loading: false,
        shipment: null,
      }));
    }
  }, []);

  // Initial fetch on mount
  useEffect(() => {
    fetchShipments(1);
  }, [fetchShipments]);

  // Refetch when filters change
  useEffect(() => {
    if (page !== 1) {
      setPage(1);
      fetchShipments(1);
    } else {
      fetchShipments(page);
    }
  }, [statusFilter, limit, fetchShipments, page]);

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchShipments(page);
    setRefreshing(false);
  };

  const handleOpenDetail = (shipment: IncomingShipment) => {
    setDetailSheet({ open: true, shipment, loading: true });
    fetchDetail(shipment.id);
  };

  const handleOpenUpdate = (shipment: IncomingShipment) => {
    setUpdateDialog({
      open: true,
      shipment,
      newStatus: shipment.status,
      notes: "",
      receivedQuantity: "",
      discrepancyReason: "",
      submitting: false,
      error: null,
    });
  };

  const handleSubmitUpdate = async () => {
    if (!updateDialog.shipment) return;

    const payload: UpdateShipmentStatusRequest = {
      status: updateDialog.newStatus as
        | "EXPECTED"
        | "IN_TRANSIT"
        | "PARTIALLY_RECEIVED"
        | "FULLY_RECEIVED"
        | "OVERDUE"
        | "CANCELLED",
    };

    // Add fields based on status
    if (updateDialog.newStatus === "IN_TRANSIT") {
      payload.notes = updateDialog.notes;
    } else if (updateDialog.newStatus === "FULLY_RECEIVED") {
      payload.receivedQuantity = parseInt(updateDialog.receivedQuantity) || 0;
      payload.notes = updateDialog.notes;
    } else if (updateDialog.newStatus === "PARTIALLY_RECEIVED") {
      payload.receivedQuantity = parseInt(updateDialog.receivedQuantity) || 0;
      payload.discrepancyQuantity =
        (updateDialog.shipment.expectedQuantity || 0) -
        (parseInt(updateDialog.receivedQuantity) || 0);
      payload.discrepancyReason = updateDialog.discrepancyReason as
        | "SHORTAGE"
        | "EXCESS"
        | "DAMAGED";
      payload.notes = updateDialog.notes;
    } else if (updateDialog.newStatus === "CANCELLED") {
      payload.notes = updateDialog.notes;
    }

    try {
      setUpdateDialog((prev) => ({ ...prev, submitting: true, error: null }));
      console.log("Submitting status update:", payload);
      await ShopAdminAPI.stock.incomingShipments.updateStatus(
        updateDialog.shipment.id,
        payload as UpdateShipmentStatusRequest
      );

      // Refresh data
      await fetchShipments(page);
      setUpdateDialog({ ...updateDialog, open: false, submitting: false });

      // Re-fetch detail if it's open
      if (detailSheet.open && detailSheet.shipment) {
        fetchDetail(detailSheet.shipment.id);
      }
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to update status";
      console.error("Error updating status:", err);
      setUpdateDialog((prev) => ({
        ...prev,
        submitting: false,
        error: errorMsg,
      }));
    }
  };

  const hasNextPage = page * limit < total;
  const hasPrevPage = page > 1;

  const pageSize = useMemo(
    () =>
      [10, 20, 50].map((size) => ({ value: size, label: `${size} per page` })),
    []
  );

  return (
    <div className="w-full space-y-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Package className="w-6 h-6" />
            Incoming Shipments
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage and track incoming product shipments
          </p>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={refreshing}
          variant="outline"
          size="sm"
        >
          <RefreshCcw
            className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      <Separator />

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <select
          value={statusFilter}
          onChange={handleStatusChange}
          className="px-3 py-2 border rounded-md text-sm bg-white"
        >
          <option value="ALL">All Statuses</option>
          <option value="EXPECTED">Expected</option>
          <option value="IN_TRANSIT">In Transit</option>
          <option value="PARTIALLY_RECEIVED">Partially Received</option>
          <option value="FULLY_RECEIVED">Fully Received</option>
          <option value="OVERDUE">Overdue</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Product</th>
                <th className="px-4 py-3 text-left font-semibold">Retailer</th>
                <th className="px-4 py-3 text-left font-semibold">Shop</th>
                <th className="px-4 py-3 text-center font-semibold">Qty</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
                <th className="px-4 py-3 text-left font-semibold">Date</th>
                <th className="px-4 py-3 text-center font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: limit }).map((_, i) => (
                  <tr key={i} className="border-b">
                    <td colSpan={7} className="px-4 py-3">
                      <Skeleton className="h-4 w-full" />
                    </td>
                  </tr>
                ))
              ) : shipments.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    No shipments found
                  </td>
                </tr>
              ) : (
                shipments.map((shipment) => {
                  const config =
                    statusConfig[shipment.status] || statusConfig.EXPECTED;
                  return (
                    <tr key={shipment.id} className={`border-b ${config.bg}`}>
                      <td className="px-4 py-3 font-medium">
                        {shipment.product?.name || "—"}
                      </td>
                      <td className="px-4 py-3">
                        {shipment.retailer?.name || "—"}
                      </td>
                      <td className="px-4 py-3">
                        {shipment.shop?.name || "—"}
                      </td>
                      <td className="px-4 py-3 text-center font-semibold">
                        {shipment.expectedQuantity}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {config.icon}
                          <span
                            className={`text-xs font-semibold ${config.text}`}
                          >
                            {config.label}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">
                        {shipment.expectedDeliveryDate
                          ? new Date(
                              shipment.expectedDeliveryDate
                            ).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenDetail(shipment)}
                          >
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleOpenUpdate(shipment)}
                          >
                            Update
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="border-t px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Page Size:</span>
            <select
              value={limit}
              onChange={(e) => setLimit(parseInt(e.target.value))}
              className="px-2 py-1 border rounded text-sm"
            >
              {pageSize.map((size) => (
                <option key={size.value} value={size.value}>
                  {size.label}
                </option>
              ))}
            </select>
          </div>

          <div className="text-sm text-gray-600">
            Page {page} of {Math.ceil(total / limit) || 1} ({total} total)
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => fetchShipments(page - 1)}
              disabled={!hasPrevPage || loading}
              variant="outline"
              size="sm"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              onClick={() => fetchShipments(page + 1)}
              disabled={!hasNextPage || loading}
              variant="outline"
              size="sm"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Detail Sheet */}
      <Sheet
        open={detailSheet.open}
        onOpenChange={(open) => {
          setDetailSheet({ ...detailSheet, open });
          if (!open) {
            setDetailSheet({ open: false, shipment: null, loading: false });
          }
        }}
      >
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Shipment Details</SheetTitle>
          </SheetHeader>

          {detailSheet.loading ? (
            <div className="space-y-4 mt-6">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          ) : detailSheet.shipment ? (
            <div className="space-y-6 mt-6">
              {/* Product Info */}
              <div>
                <h3 className="font-semibold text-sm mb-2">Product</h3>
                <div className="bg-gray-50 rounded p-3 space-y-1 text-sm">
                  <p>
                    <span className="font-medium">Name:</span>{" "}
                    {detailSheet.shipment.product?.name || "—"}
                  </p>
                  <p>
                    <span className="font-medium">SKU:</span>{" "}
                    {detailSheet.shipment.product?.sku || "—"}
                  </p>
                  <p>
                    <span className="font-medium">Company:</span>{" "}
                    {detailSheet.shipment.product?.company?.name || "—"}
                  </p>
                </div>
              </div>

              {/* Shop Info */}
              <div>
                <h3 className="font-semibold text-sm mb-2">Shop & Retailer</h3>
                <div className="bg-gray-50 rounded p-3 space-y-1 text-sm">
                  <p>
                    <span className="font-medium">Shop:</span>{" "}
                    {detailSheet.shipment.shop?.name || "—"}
                  </p>
                  <p>
                    <span className="font-medium">Location:</span>{" "}
                    {detailSheet.shipment.shop?.address || "—"}
                  </p>
                  <p>
                    <span className="font-medium">Retailer:</span>{" "}
                    {detailSheet.shipment.retailer?.name || "—"}
                  </p>
                </div>
              </div>

              {/* Quantities */}
              <div>
                <h3 className="font-semibold text-sm mb-2">Quantities</h3>
                <div className="bg-gray-50 rounded p-3 space-y-1 text-sm">
                  <p>
                    <span className="font-medium">Expected:</span>{" "}
                    {detailSheet.shipment.expectedQuantity}
                  </p>
                  {detailSheet.shipment.stockReceipt && (
                    <>
                      <p>
                        <span className="font-medium">Received:</span>{" "}
                        {detailSheet.shipment.stockReceipt.receivedQuantity ||
                          0}
                      </p>
                      <p>
                        <span className="font-medium">Receipt Status:</span>{" "}
                        <Badge variant="outline" className="ml-1">
                          {detailSheet.shipment.stockReceipt.status}
                        </Badge>
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Status & Dates */}
              <div>
                <h3 className="font-semibold text-sm mb-2">
                  Status & Timeline
                </h3>
                <div className="bg-gray-50 rounded p-3 space-y-1 text-sm">
                  <p>
                    <span className="font-medium">Current Status:</span>{" "}
                    <span
                      className={
                        statusConfig[detailSheet.shipment.status]?.text || ""
                      }
                    >
                      {statusConfig[detailSheet.shipment.status]?.label ||
                        detailSheet.shipment.status}
                    </span>
                  </p>
                  <p>
                    <span className="font-medium">Expected Delivery:</span>{" "}
                    {detailSheet.shipment.expectedDeliveryDate
                      ? new Date(
                          detailSheet.shipment.expectedDeliveryDate
                        ).toLocaleDateString()
                      : "—"}
                  </p>
                  <p>
                    <span className="font-medium">Actual Delivery:</span>{" "}
                    {detailSheet.shipment.actualDeliveryDate
                      ? new Date(
                          detailSheet.shipment.actualDeliveryDate
                        ).toLocaleDateString()
                      : "—"}
                  </p>
                  <p>
                    <span className="font-medium">Created:</span>{" "}
                    {new Date(
                      detailSheet.shipment.createdAt
                    ).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Notes */}
              {detailSheet.shipment.notes && (
                <div>
                  <h3 className="font-semibold text-sm mb-2">Notes</h3>
                  <div className="bg-gray-50 rounded p-3 text-sm">
                    {detailSheet.shipment.notes}
                  </div>
                </div>
              )}

              {/* Action Button */}
              <Button
                onClick={() => {
                  setDetailSheet({ ...detailSheet, open: false });
                  handleOpenUpdate(detailSheet.shipment!);
                }}
                className="w-full"
              >
                Update Status
              </Button>
            </div>
          ) : (
            <div className="text-center text-gray-500 mt-6">
              Failed to load shipment details
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Update Status Dialog */}
      <Dialog
        open={updateDialog.open}
        onOpenChange={(open) => {
          setUpdateDialog({ ...updateDialog, open });
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Shipment Status</DialogTitle>
            <DialogDescription>
              Update the status of shipment for{" "}
              {updateDialog.shipment?.product?.name || "this shipment"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* Status Selection */}
            <div>
              <label className="block text-sm font-medium mb-2">
                New Status
              </label>
              <select
                value={updateDialog.newStatus}
                onChange={(e) =>
                  setUpdateDialog({
                    ...updateDialog,
                    newStatus: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border rounded-md text-sm"
              >
                <option value="EXPECTED">Expected</option>
                <option value="IN_TRANSIT">In Transit</option>
                <option value="PARTIALLY_RECEIVED">Partially Received</option>
                <option value="FULLY_RECEIVED">Fully Received</option>
                <option value="OVERDUE">Overdue</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            {/* Received Quantity (for FULLY_RECEIVED, PARTIALLY_RECEIVED) */}
            {(updateDialog.newStatus === "FULLY_RECEIVED" ||
              updateDialog.newStatus === "PARTIALLY_RECEIVED") && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Received Quantity
                </label>
                <Input
                  type="number"
                  min="0"
                  value={updateDialog.receivedQuantity}
                  onChange={(e) =>
                    setUpdateDialog({
                      ...updateDialog,
                      receivedQuantity: e.target.value,
                    })
                  }
                  placeholder="Enter received quantity"
                />
              </div>
            )}

            {/* Discrepancy Reason (for PARTIALLY_RECEIVED) */}
            {updateDialog.newStatus === "PARTIALLY_RECEIVED" && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Discrepancy Reason
                </label>
                <select
                  value={updateDialog.discrepancyReason}
                  onChange={(e) =>
                    setUpdateDialog({
                      ...updateDialog,
                      discrepancyReason: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border rounded-md text-sm"
                >
                  <option value="">Select a reason</option>
                  <option value="SHORTAGE">Shortage</option>
                  <option value="EXCESS">Excess</option>
                  <option value="DAMAGED">Damaged</option>
                </select>
              </div>
            )}

            {/* Notes */}
            {(updateDialog.newStatus === "IN_TRANSIT" ||
              updateDialog.newStatus === "FULLY_RECEIVED" ||
              updateDialog.newStatus === "PARTIALLY_RECEIVED" ||
              updateDialog.newStatus === "CANCELLED") && (
              <div>
                <label className="block text-sm font-medium mb-2">Notes</label>
                <textarea
                  value={updateDialog.notes}
                  onChange={(e) =>
                    setUpdateDialog({ ...updateDialog, notes: e.target.value })
                  }
                  placeholder="Add any notes..."
                  className="w-full px-3 py-2 border rounded-md text-sm"
                  rows={3}
                />
              </div>
            )}

            {/* Error */}
            {updateDialog.error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{updateDialog.error}</AlertDescription>
              </Alert>
            )}

            {/* Actions */}
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() =>
                  setUpdateDialog({ ...updateDialog, open: false })
                }
                disabled={updateDialog.submitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitUpdate}
                disabled={updateDialog.submitting}
              >
                {updateDialog.submitting ? "Updating..." : "Update Status"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default IncomingShipments;
