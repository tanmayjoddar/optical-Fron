import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { StaffAPI } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert } from "@/components/ui/alert";
import {
  RefreshCcw,
  ArrowLeft,
  Download,
  Printer,
  Mail,
  Eye,
} from "lucide-react";
import InvoicePdfViewer from "@/Pages/StaffDashboard/InvoicePdfViewer";
import InvoiceThermalPrint from "@/Pages/StaffDashboard/InvoiceThermalPrint";
import { formatCurrency } from "@/lib/currency";

interface InvoiceItem {
  productId?: number;
  product?: { id?: number; name?: string; barcode?: string };
  productName?: string; // fallback if api returns name inline
  quantity?: number;
  unitPrice?: number; // calculated by backend
  discount?: number; // absolute amount in ₹
  cgst?: number; // absolute amount in ₹
  sgst?: number; // absolute amount in ₹
  totalPrice?: number; // calculated by backend
}

interface PaymentRecord {
  id?: string | number;
  amount?: number;
  method?: string;
  createdAt?: string;
  notes?: string;
}

interface InvoiceResponse {
  id?: string | number;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  items?: InvoiceItem[];
  total?: number; // possible aggregate from backend
  paidAmount?: number;
  notes?: string;
  patientId?: number;
  patient?: { id?: number; name?: string };
  customerId?: number;
  customer?: { id?: number; name?: string };
  payments?: PaymentRecord[];
}

const statusColor: Record<string, string> = {
  PAID: "bg-green-600 text-white",
  UNPAID: "bg-orange-500 text-white",
  PARTIALLY_PAID: "bg-amber-500 text-white",
  CANCELLED: "bg-red-600 text-white",
  REFUNDED: "bg-red-500 text-white",
};

// use formatCurrency from src/lib/currency for consistent formatting

const InvoiceDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<InvoiceResponse | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadingThermal, setDownloadingThermal] = useState(false);
  // Status update form state
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [statusReason, setStatusReason] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  // Payment form state
  const [addingPayment, setAddingPayment] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [giftCardCode, setGiftCardCode] = useState("");
  const [giftLookupLoading, setGiftLookupLoading] = useState(false);
  const [giftData, setGiftData] = useState<{
    id?: number;
    code?: string;
    balance?: number;
  } | null>(null);
  const [paymentMessage, setPaymentMessage] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  // Delete state
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  // PDF modal state
  const [pdfOpen, setPdfOpen] = useState(false);
  const [thermalOpen, setThermalOpen] = useState(false);

  const fetchInvoice = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const res = await StaffAPI.invoices.getById(String(id));
      setData(res);
    } catch (e: unknown) {
      const error = e as { response?: { data?: { message?: string } } };
      setError(error?.response?.data?.message || "Failed to load invoice");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchInvoice();
  }, [fetchInvoice]);

  const computedTotals = useMemo(() => {
    if (!data?.items)
      return { sub: 0, discount: 0, cgst: 0, sgst: 0, grand: data?.total ?? 0 };
    let sub = 0,
      discount = 0,
      cgst = 0,
      sgst = 0;
    data.items.forEach((it) => {
      const qty = it.quantity || 0;
      const price = it.unitPrice || 0;
      const disc = it.discount || 0; // absolute amount
      const cgstAmt = it.cgst || 0; // absolute amount
      const sgstAmt = it.sgst || 0; // absolute amount
      const base = qty * price;
      sub += base;
      discount += disc;
      cgst += cgstAmt;
      sgst += sgstAmt;
    });
    const grand = sub - discount + cgst + sgst;
    return { sub, discount, cgst, sgst, grand };
  }, [data]);

  const balance = useMemo(() => {
    const paid = data?.paidAmount || 0;
    const total = data?.total ?? computedTotals.grand;
    return Math.max(0, total - paid);
  }, [data, computedTotals]);

  const downloadPdf = async () => {
    if (!id) return;
    setDownloadingPdf(true);
    try {
      const blob = await StaffAPI.invoices.getPdf(String(id));
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      /* silent */
    } finally {
      setDownloadingPdf(false);
    }
  };

  const openThermal = async () => {
    if (!id) return;
    setDownloadingThermal(true);
    try {
      const html = await StaffAPI.invoices.getThermal(String(id));
      const w = window.open("", "_blank");
      if (w) {
        w.document.write(html);
        w.document.close();
      }
    } catch {
      /* silent */
    } finally {
      setDownloadingThermal(false);
    }
  };

  const statusBadge = (st?: string) => {
    if (!st)
      return (
        <span className="px-2 py-0.5 rounded text-xs bg-gray-300 text-gray-800">
          —
        </span>
      );
    const lower = st.toLowerCase();
    const cls = statusColor[lower] || "bg-gray-300 text-gray-800";
    const label = lower.charAt(0).toUpperCase() + lower.slice(1);
    return (
      <span className={`px-2 py-0.5 rounded text-xs font-medium ${cls}`}>
        {label}
      </span>
    );
  };

  const balanceBadge = () => {
    const total = data?.total ?? computedTotals.grand;
    const paid = data?.paidAmount || 0;
    if (!total || total === 0) return null;
    if (paid >= total)
      return (
        <span className="px-2 py-0.5 rounded text-xs bg-green-600 text-white">
          Paid in Full
        </span>
      );
    if (paid > 0)
      return (
        <span className="px-2 py-0.5 rounded text-xs bg-amber-500 text-white">
          Partially Paid
        </span>
      );
    return (
      <span className="px-2 py-0.5 rounded text-xs bg-red-600 text-white">
        Unpaid
      </span>
    );
  };

  // Auto clear transient messages (status & payment)
  useEffect(() => {
    if (statusMessage) {
      const t = setTimeout(() => setStatusMessage(null), 2500);
      return () => clearTimeout(t);
    }
  }, [statusMessage]);
  useEffect(() => {
    if (paymentMessage) {
      const t = setTimeout(() => setPaymentMessage(null), 2500);
      return () => clearTimeout(t);
    }
  }, [paymentMessage]);

  const methodBadge = (method?: string) => {
    if (!method)
      return (
        <span className="text-[10px] px-1 py-0.5 rounded bg-muted">—</span>
      );
    const m = method.toLowerCase();
    const map: Record<string, string> = {
      cash: "bg-emerald-600 text-white",
      card: "bg-indigo-600 text-white",
      upi: "bg-purple-600 text-white",
      other: "bg-slate-500 text-white",
    };
    return (
      <span
        className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
          map[m] || "bg-slate-400 text-white"
        }`}
      >
        {m.toUpperCase()}
      </span>
    );
  };

  return (
    <div className="p-4 space-y-6">
      {/* Breadcrumb */}
      <nav
        className="text-[11px] text-muted-foreground flex gap-1 flex-wrap"
        aria-label="Breadcrumb"
      >
        <button
          className="underline hover:text-foreground"
          onClick={() => navigate("/staff-dashboard")}
        >
          Dashboard
        </button>
        <span>/</span>
        <button
          className="underline hover:text-foreground"
          onClick={() => navigate("/staff-dashboard/invoices")}
        >
          Invoices
        </button>
        <span>/</span>
        <span className="text-foreground">#{id}</span>
      </nav>
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3 flex-wrap">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <h1 className="text-2xl font-bold">Invoice #{id}</h1>
            {statusBadge(data?.status)}
            {balanceBadge()}
          </div>
          <p className="text-xs text-muted-foreground">
            Created{" "}
            {data?.createdAt ? new Date(data.createdAt).toLocaleString() : "—"}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            size="sm"
            variant="outline"
            onClick={fetchInvoice}
            disabled={loading}
          >
            <RefreshCcw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setPdfOpen(true)}
            disabled={loading}
          >
            <Eye className="h-4 w-4 mr-1" />
            View PDF
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={downloadPdf}
            disabled={downloadingPdf || loading}
          >
            <Download className="h-4 w-4 mr-1" />
            Download
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setThermalOpen(true)}
            disabled={loading}
          >
            <Eye className="h-4 w-4 mr-1" />
            View Thermal
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={openThermal}
            disabled={downloadingThermal || loading}
          >
            <Printer className="h-4 w-4 mr-1" />
            Quick Thermal
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled
            title="Batch PDFs (coming soon)"
          >
            Batch PDFs
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled
            title="Batch Thermal (coming soon)"
          >
            Batch Thermal
          </Button>
          <Button size="sm" variant="outline" disabled>
            <Mail className="h-4 w-4 mr-1" />
            Email
          </Button>
          <Button size="sm" variant="outline" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-1" />
            Print
          </Button>
        </div>
      </div>

      {error && <Alert variant="destructive">{error}</Alert>}

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-4 space-y-2">
          <h2 className="text-sm font-semibold">Party</h2>
          <div className="text-xs text-muted-foreground space-y-1">
            {data?.patient || data?.patientId ? (
              <div>Patient: {data?.patient?.name || data?.patientId}</div>
            ) : null}
            {data?.customer || data?.customerId ? (
              <div>Customer: {data?.customer?.name || data?.customerId}</div>
            ) : null}
            {!data?.patientId && !data?.customerId && <div>—</div>}
          </div>
          {data?.notes && (
            <div className="text-xs pt-2">
              <span className="font-medium">Notes:</span> {data.notes}
            </div>
          )}
        </Card>
        <Card className="p-4 space-y-2">
          <h2 className="text-sm font-semibold">Amounts</h2>
          <div className="text-xs space-y-1">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatCurrency(computedTotals.sub)}</span>
            </div>
            <div className="flex justify-between">
              <span>Discount</span>
              <span>{formatCurrency(computedTotals.discount)}</span>
            </div>
            <div className="flex justify-between">
              <span>CGST</span>
              <span>{formatCurrency(computedTotals.cgst)}</span>
            </div>
            <div className="flex justify-between">
              <span>SGST</span>
              <span>{formatCurrency(computedTotals.sgst)}</span>
            </div>
            <Separator className="my-1" />
            <div className="flex justify-between font-semibold">
              <span>Grand</span>
              <span>{formatCurrency(data?.total ?? computedTotals.grand)}</span>
            </div>
          </div>
        </Card>
        <Card className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Status & Payments</h2>
            <span className="text-[10px] text-muted-foreground">
              Manage invoice lifecycle
            </span>
          </div>
          <div className="grid gap-2 text-xs">
            <div className="flex justify-between">
              <span>Current Status</span>
              <span>{statusBadge(data?.status)}</span>
            </div>
            <div className="flex justify-between">
              <span>Paid</span>
              <span>{formatCurrency(data?.paidAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span>Balance</span>
              <span>{formatCurrency(balance)}</span>
            </div>
          </div>
          {/* Status Update Form */}
          <div className="space-y-2 border rounded-md p-3 bg-muted/30">
            <div className="flex items-center justify-between">
              <h3 className="text-[11px] font-semibold tracking-wide">
                Update Status
              </h3>
              {statusMessage && (
                <span className="text-[10px] text-green-600">
                  {statusMessage}
                </span>
              )}
              {statusError && !statusMessage && (
                <span className="text-[10px] text-red-600">{statusError}</span>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex gap-2 items-center">
                <select
                  className="border rounded px-2 py-1 text-xs bg-background"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  disabled={statusUpdating}
                >
                  <option value="">Select…</option>
                  {["pending", "unpaid", "paid", "cancelled"]
                    .filter((s) => s !== data?.status?.toLowerCase())
                    .map((s) => (
                      <option key={s} value={s}>
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </option>
                    ))}
                </select>
                <Input
                  placeholder="Reason (optional)"
                  className="h-8 text-xs"
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  disabled={statusUpdating}
                />
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!newStatus || statusUpdating}
                  onClick={async () => {
                    if (!id || !newStatus) return;
                    if (
                      data?.status?.toLowerCase() === "paid" &&
                      newStatus !== "paid"
                    ) {
                      const ok = window.confirm(
                        "Invoice is paid. Change status anyway?"
                      );
                      if (!ok) return;
                    }
                    if (newStatus === "cancelled" && !statusReason) {
                      const ok = window.confirm(
                        "Cancelling without a reason. Continue?"
                      );
                      if (!ok) return;
                    }
                    try {
                      setStatusUpdating(true);
                      setStatusError(null);
                      setStatusMessage(null);
                      await StaffAPI.invoices.updateStatus(String(id), {
                        status: newStatus,
                        reason: statusReason || undefined,
                      });
                      setStatusMessage("Status updated");
                      setNewStatus("");
                      setStatusReason("");
                      await fetchInvoice();
                    } catch (e: unknown) {
                      const error = e as {
                        response?: { data?: { message?: string } };
                      };
                      setStatusError(
                        error?.response?.data?.message ||
                          "Failed to update status"
                      );
                    } finally {
                      setStatusUpdating(false);
                    }
                  }}
                >
                  {statusUpdating ? "Updating…" : "Apply"}
                </Button>
              </div>
            </div>
          </div>
          {/* Add Payment Form */}
          <div className="space-y-2 border rounded-md p-3 bg-muted/30">
            <div className="flex items-center justify-between">
              <h3 className="text-[11px] font-semibold tracking-wide">
                Add Payment
              </h3>
              {paymentMessage && (
                <span className="text-[10px] text-green-600">
                  {paymentMessage}
                </span>
              )}
              {paymentError && !paymentMessage && (
                <span className="text-[10px] text-red-600">{paymentError}</span>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <div className="grid grid-cols-5 gap-2 items-center">
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  className="col-span-2 h-8 text-xs"
                  placeholder="Amount"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  disabled={addingPayment}
                />
                <div className="col-span-3 grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <Input
                      placeholder="Gift Card Code (optional)"
                      value={giftCardCode}
                      onChange={(e) => setGiftCardCode(e.target.value)}
                      className="text-xs"
                    />
                  </div>
                  <div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        if (!giftCardCode.trim()) {
                          setGiftData(null);
                          return;
                        }
                        try {
                          setGiftLookupLoading(true);
                          const res = await StaffAPI.giftCards.getBalance(
                            giftCardCode.trim()
                          );
                          setGiftData(res);
                        } catch {
                          setGiftData(null);
                        } finally {
                          setGiftLookupLoading(false);
                        }
                      }}
                      disabled={giftLookupLoading}
                    >
                      {giftLookupLoading ? "..." : "Lookup"}
                    </Button>
                  </div>
                </div>
                {giftData && (
                  <div className="col-span-5 text-xs text-muted-foreground mt-1">
                    <div>
                      Found Gift Card:{" "}
                      <span className="font-medium">
                        {giftData.code || giftCardCode}
                      </span>{" "}
                      — Balance:{" "}
                      <span className="font-semibold">
                        {formatCurrency(giftData.balance)}
                      </span>
                    </div>
                  </div>
                )}
                <select
                  className="border rounded px-2 py-1 text-xs bg-background col-span-1"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  disabled={addingPayment}
                >
                  {["CASH", "CARD", "UPI", "GIFT_CARD", "OTHER"].map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
                <Input
                  className="col-span-2 h-8 text-xs"
                  placeholder="Notes (optional)"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  disabled={addingPayment}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={
                    addingPayment ||
                    !paymentAmount ||
                    parseFloat(paymentAmount || "0") <= 0 ||
                    parseFloat(paymentAmount || "0") > balance
                  }
                  onClick={async () => {
                    if (!id) return;
                    const amt = parseFloat(paymentAmount || "0");
                    if (!amt || amt <= 0) return;
                    if (amt > balance) {
                      setPaymentError("Amount exceeds balance");
                      return;
                    }
                    try {
                      setAddingPayment(true);
                      setPaymentError(null);
                      setPaymentMessage(null);
                      let remaining = amt;
                      // If a gift card is selected, attempt to redeem from it first.
                      if (
                        giftData &&
                        giftData.balance &&
                        giftData.balance > 0
                      ) {
                        const redeemAmt = Math.min(
                          remaining,
                          Number(giftData.balance || 0)
                        );
                        if (redeemAmt > 0) {
                          // Redeem on gift card endpoint (reduces balance)
                          await StaffAPI.giftCards.redeem({
                            code: giftData.code || giftCardCode.trim(),
                            amount: redeemAmt,
                          });
                          // Post payment linked to gift card
                          await StaffAPI.invoices.addPayment(String(id), {
                            amount: redeemAmt,
                            method: "gift",
                            notes: paymentNotes || undefined,
                            giftCardId: giftData.id,
                          });
                          remaining = Math.max(0, remaining - redeemAmt);
                        }
                      }
                      // If any remaining amount, post as the chosen payment method
                      if (remaining > 0) {
                        await StaffAPI.invoices.addPayment(String(id), {
                          amount: remaining,
                          method: paymentMethod,
                          notes: paymentNotes || undefined,
                        });
                      }
                      setPaymentMessage("Payment added");
                      setPaymentAmount("");
                      setPaymentNotes("");
                      setGiftCardCode("");
                      setGiftData(null);
                      await fetchInvoice();
                      // Auto-mark paid if fully settled
                      const newBal = Math.max(
                        0,
                        (data?.total ?? computedTotals.grand) -
                          ((data?.paidAmount || 0) + amt)
                      );
                      if (
                        newBal === 0 &&
                        data?.status?.toLowerCase() !== "paid"
                      ) {
                        try {
                          await StaffAPI.invoices.updateStatus(String(id), {
                            status: "paid",
                            reason: "Auto-marked after full payment",
                          });
                          await fetchInvoice();
                        } catch {
                          /* ignore */
                        }
                      }
                    } catch (e: unknown) {
                      const error = e as {
                        response?: { data?: { message?: string } };
                      };
                      setPaymentError(
                        error?.response?.data?.message ||
                          "Failed to add payment"
                      );
                    } finally {
                      setAddingPayment(false);
                    }
                  }}
                >
                  {addingPayment ? "Saving…" : "Add Payment"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={addingPayment && !paymentAmount}
                  onClick={() => {
                    setPaymentAmount("");
                    setPaymentNotes("");
                    setPaymentError(null);
                    setPaymentMessage(null);
                  }}
                >
                  Reset
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Amount must be greater than 0 and not exceed the remaining
                balance.
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Line Items</h2>
        </div>
        {loading ? (
          <div className="text-xs text-muted-foreground">Loading...</div>
        ) : !data?.items?.length ? (
          <div className="text-xs text-muted-foreground">No items.</div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Unit</TableHead>
                  <TableHead className="text-right">Discount</TableHead>
                  <TableHead className="text-right">CGST</TableHead>
                  <TableHead className="text-right">SGST</TableHead>
                  <TableHead className="text-right">Line Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items!.map((it, idx) => {
                  const qty = it.quantity || 0;
                  const price = it.unitPrice || 0;
                  const disc = it.discount || 0; // absolute amount
                  const cgstAmt = it.cgst || 0; // absolute amount
                  const sgstAmt = it.sgst || 0; // absolute amount
                  const base = qty * price;
                  const taxable = Math.max(0, base - disc);
                  const total = taxable + cgstAmt + sgstAmt;
                  return (
                    <TableRow key={idx}>
                      <TableCell className="whitespace-nowrap">
                        {it.product?.name ||
                          it.productName ||
                          it.productId ||
                          "—"}
                      </TableCell>
                      <TableCell className="text-right">{qty}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(price)}
                      </TableCell>
                      <TableCell className="text-right">
                        {disc ? formatCurrency(disc) : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(cgstAmt)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(sgstAmt)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(total)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      <Card className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Payment Records</h2>
          <span className="text-[10px] text-muted-foreground">History</span>
        </div>
        {loading ? (
          <div className="text-xs text-muted-foreground">Loading...</div>
        ) : !data?.payments?.length ? (
          <div className="text-xs text-muted-foreground">No payments yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.payments!.map((p) => (
                  <TableRow key={p.id || p.createdAt + String(p.amount)}>
                    <TableCell>
                      {p.createdAt
                        ? new Date(p.createdAt).toLocaleString()
                        : "—"}
                    </TableCell>
                    <TableCell>{formatCurrency(p.amount)}</TableCell>
                    <TableCell>{methodBadge(p.method)}</TableCell>
                    <TableCell className="max-w-xs truncate" title={p.notes}>
                      {p.notes || "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* Danger Zone */}
      <Card className="p-4 space-y-3 border border-red-300 bg-red-50">
        <h2 className="text-sm font-semibold text-red-700">Danger Zone</h2>
        <p className="text-[11px] leading-relaxed text-red-600">
          Deleting an invoice permanently removes its line items and payment
          history. This cannot be undone.
        </p>
        {deleteError && (
          <div className="text-[11px] text-red-700">{deleteError}</div>
        )}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="destructive"
            size="sm"
            disabled={deleting || loading}
            onClick={async () => {
              if (!id) return;
              setDeleteError(null);
              const hasPayments = (data?.payments?.length || 0) > 0;
              const isPaid = data?.status?.toLowerCase() === "paid";
              if (hasPayments) {
                const c1 = window.confirm(
                  "This invoice has payment records. Deleting will also remove them. Continue?"
                );
                if (!c1) return;
              }
              if (isPaid) {
                const c2 = window.confirm(
                  "Invoice is marked as Paid. Are you sure you want to delete it?"
                );
                if (!c2) return;
              }
              const phrase = window.prompt(
                "Type DELETE to confirm permanent removal of this invoice:"
              );
              if (phrase !== "DELETE") {
                return;
              }
              try {
                setDeleting(true);
                await StaffAPI.invoices.delete(String(id));
                navigate("/staff-dashboard/invoices?deleted=1");
              } catch (e: unknown) {
                const error = e as {
                  response?: { data?: { message?: string } };
                  message?: string;
                };
                setDeleteError(
                  error?.response?.data?.message ||
                    error?.message ||
                    "Failed to delete invoice"
                );
              } finally {
                setDeleting(false);
              }
            }}
          >
            {deleting ? "Deleting…" : "Delete Invoice"}
          </Button>
        </div>
      </Card>
      <InvoicePdfViewer
        invoiceId={String(id)}
        open={pdfOpen}
        onOpenChange={setPdfOpen}
      />
      <InvoiceThermalPrint
        invoiceId={String(id)}
        open={thermalOpen}
        onOpenChange={setThermalOpen}
      />
    </div>
  );
};

export default InvoiceDetail;
