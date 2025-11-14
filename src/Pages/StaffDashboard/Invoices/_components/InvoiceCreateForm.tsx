import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { StaffAPI } from "@/lib/api";
import { formatCurrency } from "@/lib/currency";

// Types for line items in the draft invoice
interface DraftLineItem {
  id: string; // client-only id
  productId?: number;
  productName?: string;
  productPrice?: number; // for display only, fetched from product
  quantity: number;
  discount?: string; // absolute amount in ₹
  cgst?: string; // absolute amount in ₹
  sgst?: string; // absolute amount in ₹
  loadingProduct?: boolean;
}

interface Invoice {
  id?: number;
  [key: string]: unknown;
}

interface InvoiceCreateFormProps {
  onCreated?: (invoice: Invoice) => void;
}

const InvoiceCreateForm: React.FC<InvoiceCreateFormProps> = ({ onCreated }) => {
  const navigate = useNavigate();
  // Party selection (either patient or customer for now we support patientId only per API definition)
  const [patientId, setPatientId] = useState("");
  const [notes, setNotes] = useState("");

  const [items, setItems] = useState<DraftLineItem[]>([
    { id: "li-1", quantity: 1, discount: "", cgst: "", sgst: "" },
  ]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<Invoice | null>(null);
  const [paidAmount, setPaidAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [giftCardCode, setGiftCardCode] = useState("");
  const [giftLookupLoading, setGiftLookupLoading] = useState(false);
  const [giftData, setGiftData] = useState<{
    id?: number;
    code?: string;
    balance?: number;
  } | null>(null);
  const [globalProductSearch, setGlobalProductSearch] = useState("");
  const [productOptions, setProductOptions] = useState<
    Array<{
      id?: number;
      name?: string;
      basePrice?: number;
      currentStock?: number;
      barcode?: string;
    }>
  >([]);
  // Removed loadingProducts flag (not used in UI rendering currently)

  // Load a limited product list for selection
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const data = await StaffAPI.inventory.getProducts({
          page: 1,
          limit: 100,
        });
        const list = Array.isArray(data?.items)
          ? data.items
          : Array.isArray(data)
          ? data
          : [];
        setProductOptions(list);
      } catch {
        // ignore
      } finally {
        /* loading flag removed */
      }
    };
    loadProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    if (!globalProductSearch) return productOptions;
    const q = globalProductSearch.toLowerCase();
    return productOptions.filter(
      (p) =>
        (p.name || "").toLowerCase().includes(q) ||
        String(p.id) === globalProductSearch
    );
  }, [productOptions, globalProductSearch]);

  const updateItem = (id: string, patch: Partial<DraftLineItem>) => {
    setItems((list) =>
      list.map((l) => {
        if (l.id === id) {
          const updated = { ...l, ...patch };
          // If productId changed, fetch product details to get price
          if (
            patch.productId !== undefined &&
            patch.productId !== l.productId
          ) {
            const product = productOptions.find(
              (p) => p.id === patch.productId
            );
            if (product) {
              updated.productPrice = product.basePrice || 0;
              updated.productName = product.name;
            }
          }
          return updated;
        }
        return l;
      })
    );
  };
  const removeItem = (id: string) => {
    setItems((list) =>
      list.length === 1 ? list : list.filter((l) => l.id !== id)
    );
  };
  const addItem = () => {
    setItems((list) => [
      ...list,
      {
        id: `li-${list.length + 1}`,
        quantity: 1,
        discount: "",
        cgst: "",
        sgst: "",
      },
    ]);
  };

  // Derived totals (note: backend calculates final prices from product.basePrice)
  const totals = useMemo(() => {
    let sub = 0;
    let cgst = 0;
    let sgst = 0;
    let discountTotal = 0;
    items.forEach((i) => {
      const qty = i.quantity || 0;
      const price = i.productPrice || 0;
      const disc = parseFloat(i.discount || "0") || 0; // absolute amount discount
      const cgstAmt = parseFloat(i.cgst || "0") || 0; // absolute CGST amount
      const sgstAmt = parseFloat(i.sgst || "0") || 0; // absolute SGST amount
      const lineBase = qty * price;
      sub += lineBase;
      discountTotal += disc;
      cgst += cgstAmt;
      sgst += sgstAmt;
    });
    const taxable = Math.max(0, sub - discountTotal);
    const grand = taxable + cgst + sgst;
    return { sub, discountTotal, taxable, cgst, sgst, grand };
  }, [items]);

  const valid = useMemo(() => {
    if (items.length === 0) return false;
    if (!items.some((i) => i.productId && i.quantity > 0)) return false;
    // patientId optional (API supports patient or maybe future customer). For now allow empty.
    return true;
  }, [items]);

  const resetForm = () => {
    setItems([{ id: "li-1", quantity: 1, discount: "", cgst: "", sgst: "" }]);
    setPatientId("");
    setNotes("");
    setError(null);
    setSuccess(null);
    setPaidAmount("");
    setPaymentMethod("cash");
    setGiftCardCode("");
    setGiftData(null);
  };

  const submit = async () => {
    if (!valid) return;
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const apiItems = items
        .filter((i) => i.productId && i.quantity > 0)
        .map((i) => ({
          productId: i.productId!,
          quantity: i.quantity,
          discount: i.discount ? parseFloat(i.discount) : undefined,
          cgst: i.cgst ? parseFloat(i.cgst) : undefined,
          sgst: i.sgst ? parseFloat(i.sgst) : undefined,
        }));
      const payload: Parameters<typeof StaffAPI.invoices.create>[0] = {
        items: apiItems,
        notes: notes || undefined,
      };
      if (patientId) payload.patientId = Number(patientId);
      const created = await StaffAPI.invoices.create(payload);
      setSuccess(created);
      // If a paid amount was provided, attempt to apply payments now.
      const amt = parseFloat(paidAmount || "0") || 0;
      if (amt > 0 && created?.id) {
        let remaining = amt;
        // If a gift card was looked up, redeem from it first
        if (giftData && giftData.balance && giftData.balance > 0) {
          const redeemAmt = Math.min(remaining, Number(giftData.balance || 0));
          if (redeemAmt > 0) {
            await StaffAPI.giftCards.redeem({
              code: giftData.code || giftCardCode.trim(),
              amount: redeemAmt,
            });
            await StaffAPI.invoices.addPayment(String(created.id), {
              amount: redeemAmt,
              method: "gift",
              notes: "Redeemed via gift card",
              giftCardId: giftData.id,
            });
            remaining = Math.max(0, remaining - redeemAmt);
          }
        }
        // Any remaining amount is posted using the chosen method
        if (remaining > 0) {
          await StaffAPI.invoices.addPayment(String(created.id), {
            amount: remaining,
            method: paymentMethod,
            notes: "Payment on create",
          });
        }
      }
      onCreated?.(created);
    } catch (err: unknown) {
      const error = err as { message?: string };
      setError(error?.message || "Failed to create invoice");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-4 space-y-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-semibold">New Invoice</h2>
          <p className="text-xs text-muted-foreground">
            Add products, adjust discounts & taxes, then create the invoice.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1">
            <label className="text-xs font-medium">Gift Card (optional)</label>
            <div className="flex gap-2">
              <Input
                value={giftCardCode}
                onChange={(e) => setGiftCardCode(e.target.value)}
                placeholder="Code"
              />
              <Button
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
            {giftData && (
              <div className="text-xs text-muted-foreground">
                Found: <span className="font-medium">{giftData.code}</span> —
                Balance: {formatCurrency(giftData.balance)}
              </div>
            )}
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium">
              Paid Amount (optional)
            </label>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={paidAmount}
              onChange={(e) => setPaidAmount(e.target.value)}
              placeholder={String(formatCurrency(totals.grand))}
            />
            <div className="text-xs text-muted-foreground">
              Enter amount to take now. Use gift card to cover part by looking
              up code.
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium">Payment Method</label>
            <select
              className="border rounded px-2 py-1 text-xs bg-background w-full"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
            >
              {["cash", "card", "upi", "other"].map((m) => (
                <option key={m} value={m}>
                  {m.toUpperCase()}
                </option>
              ))}
            </select>
            <div className="flex gap-2 pt-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (giftData?.balance)
                    setPaidAmount(
                      String(
                        Math.min(Number(giftData.balance || 0), totals.grand)
                      )
                    );
                }}
              >
                Apply Max from Gift
              </Button>
            </div>
          </div>
        </div>
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert>
            <AlertDescription>
              Invoice created (ID: {success?.id || "—"}). You can create
              another.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1">
            <label className="text-xs font-medium">Patient ID (optional)</label>
            <Input
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              placeholder="e.g. 42"
            />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <label className="text-xs font-medium">Notes</label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes"
            />
          </div>
        </div>

        <Separator />

        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Input
              placeholder="Search product (name or id)"
              value={globalProductSearch}
              onChange={(e) => setGlobalProductSearch(e.target.value)}
              className="w-64"
            />
            <Button variant="outline" size="sm" onClick={addItem}>
              Add Line
            </Button>
            <Button variant="outline" size="sm" onClick={resetForm}>
              Reset
            </Button>
          </div>

          <div className="space-y-2">
            {items.map((li) => {
              const product = productOptions.find((p) => p.id === li.productId);
              const qty = li.quantity;
              const price = li.productPrice || 0;
              const disc = parseFloat(li.discount || "0") || 0;
              const cgstAmt = parseFloat(li.cgst || "0") || 0;
              const sgstAmt = parseFloat(li.sgst || "0") || 0;
              const lineBase = qty * price;
              const lineTaxable = Math.max(0, lineBase - disc);
              const lineTotal = lineTaxable + cgstAmt + sgstAmt;
              return (
                <Card key={li.id} className="p-3 space-y-2 border-dashed">
                  <div className="flex flex-col md:grid md:grid-cols-10 gap-2 md:items-end">
                    <div className="col-span-3 space-y-1">
                      <label className="text-[10px] font-medium uppercase">
                        Product
                      </label>
                      <select
                        className="border rounded-md p-2 text-xs w-full bg-background"
                        value={li.productId ?? ""}
                        onChange={(e) =>
                          updateItem(li.id, {
                            productId: e.target.value
                              ? Number(e.target.value)
                              : undefined,
                          })
                        }
                      >
                        <option value="">Select…</option>
                        {filteredProducts.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}{" "}
                            {p.currentStock != null
                              ? `(Stock:${p.currentStock})`
                              : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-medium uppercase">
                        Qty
                      </label>
                      <Input
                        type="number"
                        min={1}
                        value={li.quantity}
                        onChange={(e) =>
                          updateItem(li.id, {
                            quantity: Math.max(1, Number(e.target.value)),
                          })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-medium uppercase">
                        Unit Price
                      </label>
                      <div className="border rounded-md p-2 text-xs bg-muted">
                        {formatCurrency(price)}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-medium uppercase">
                        Discount (₹)
                      </label>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={li.discount}
                        onChange={(e) =>
                          updateItem(li.id, { discount: e.target.value })
                        }
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-medium uppercase">
                        CGST (₹)
                      </label>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={li.cgst}
                        onChange={(e) =>
                          updateItem(li.id, { cgst: e.target.value })
                        }
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-medium uppercase">
                        SGST (₹)
                      </label>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={li.sgst}
                        onChange={(e) =>
                          updateItem(li.id, { sgst: e.target.value })
                        }
                        placeholder="0"
                      />
                    </div>
                    <div className="col-span-2 space-y-1 text-right md:text-left">
                      <label className="text-[10px] font-medium uppercase">
                        Line Total
                      </label>
                      <div className="text-xs font-medium">
                        {formatCurrency(lineTotal)}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        Base {formatCurrency(lineBase)}
                      </div>
                    </div>
                    <div className="space-y-1 flex md:block justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(li.id)}
                        disabled={items.length === 1}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                  {product && (
                    <div className="text-[10px] text-muted-foreground flex gap-4 flex-wrap">
                      {product.barcode && <span>BC: {product.barcode}</span>}
                      {product.currentStock != null && (
                        <span>Stock: {product.currentStock}</span>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </div>

        <Separator />
        <div className="grid gap-2 md:grid-cols-5 text-xs">
          <div className="p-2 bg-muted rounded flex items-center justify-between col-span-2">
            <span>Subtotal</span>
            <span>{formatCurrency(totals.sub)}</span>
          </div>
          <div className="p-2 bg-muted rounded flex items-center justify-between">
            <span>Discount</span>
            <span>{formatCurrency(totals.discountTotal)}</span>
          </div>
          <div className="p-2 bg-muted rounded flex items-center justify-between">
            <span>CGST</span>
            <span>{formatCurrency(totals.cgst)}</span>
          </div>
          <div className="p-2 bg-muted rounded flex items-center justify-between">
            <span>SGST</span>
            <span>{formatCurrency(totals.sgst)}</span>
          </div>
          <div className="p-2 bg-primary/10 rounded flex items-center justify-between col-span-2 md:col-span-5 font-semibold">
            <span>Grand Total</span>
            <span>{formatCurrency(totals.grand)}</span>
          </div>
        </div>

        <div className="flex gap-2 justify-end pt-2 flex-wrap">
          {!success && (
            <Button onClick={submit} disabled={!valid || submitting}>
              {submitting ? "Creating..." : "Create Invoice"}
            </Button>
          )}
          {success && (
            <>
              <Button
                variant="outline"
                onClick={() =>
                  navigate(`/staff-dashboard/invoices/${success.id}`)
                }
              >
                View Invoice
              </Button>
              <Button variant="outline" onClick={() => resetForm()}>
                Create Another
              </Button>
              <Button onClick={() => navigate("/staff-dashboard/invoices")}>
                Back to List
              </Button>
            </>
          )}
        </div>
      </Card>
    </div>
  );
};

export default InvoiceCreateForm;
