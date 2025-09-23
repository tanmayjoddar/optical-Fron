import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RetailerAPI } from "@/lib/retailerApi";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function RetailerDistributions() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  type DistributionRow = {
    id: number;
    shop?: { name?: string } | null;
    retailerProduct?: { product?: { name?: string } | null } | null;
    quantity?: number;
    totalAmount?: number;
    deliveryStatus?: string;
    paymentStatus?: string;
  };
  const [list, setList] = useState<{ distributions: DistributionRow[]; pagination?: unknown; summary?: unknown }>({ distributions: [], pagination: null, summary: null });
  const [deliveryForm, setDeliveryForm] = useState<{ status: string; date?: string; tracking?: string }>({ status: "DELIVERED" });
  const [paymentForm, setPaymentForm] = useState<{ status: string; date?: string }>({ status: "PAID" });
  const [filters, setFilters] = useState<{ shopId?: string; deliveryStatus?: string; paymentStatus?: string }>({});
  const [page, setPage] = useState(1);

  const fetchData = async (p = page) => {
    try {
      setLoading(true);
      const data = await RetailerAPI.distributions({
        page: p,
        limit: 20,
        shopId: filters.shopId || undefined,
        deliveryStatus: filters.deliveryStatus || undefined,
        paymentStatus: filters.paymentStatus || undefined,
      });
      setList((data as { distributions: DistributionRow[] }) || { distributions: [] });
      setPage(p);
    } catch (e) {
      const message = typeof e === "object" && e && "message" in e ? String((e as { message?: unknown }).message) : undefined;
      setError(message || "Failed to load distributions");
    } finally {
      setLoading(false);
    }
  };

  const fetchRef = useRef(fetchData);
  useEffect(() => { fetchRef.current = fetchData; });
  useEffect(() => {
    let mounted = true;
    (async () => { if (mounted) await fetchRef.current(1); })();
    return () => { mounted = false; };
  }, []);

  if (loading) {
    return (
      <Card className="glass-card">
        <CardHeader><CardTitle className="text-sm"><Skeleton className="h-4 w-40"/></CardTitle></CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full"/>
        </CardContent>
      </Card>
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
        <h2 className="text-2xl font-semibold text-brand-gradient">Distributions</h2>
        <p className="text-muted-foreground">Recent distributions and statuses</p>
      </div>

      <Card className="glass-card">
        <CardHeader><CardTitle className="text-brand-gradient">Recent</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center mb-4">
            <input className="border rounded-md p-2" placeholder="Shop ID" value={filters.shopId || ""} onChange={(e) => setFilters(f => ({ ...f, shopId: e.target.value }))} />
            <select className="border rounded-md p-2" value={filters.deliveryStatus || ""} onChange={(e) => setFilters(f => ({ ...f, deliveryStatus: e.target.value }))}>
              <option value="">Delivery: Any</option>
              {['PENDING','SHIPPED','IN_TRANSIT','DELIVERED','RETURNED','CANCELLED'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select className="border rounded-md p-2" value={filters.paymentStatus || ""} onChange={(e) => setFilters(f => ({ ...f, paymentStatus: e.target.value }))}>
              <option value="">Payment: Any</option>
              {['PENDING','PAID','PARTIAL','OVERDUE','CANCELLED'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <Button onClick={() => fetchData(1)}>Apply</Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground">
                  <th className="py-2 pr-4">Shop</th>
                  <th className="py-2 pr-4">Product</th>
                  <th className="py-2 pr-4">Qty</th>
                  <th className="py-2 pr-4">Amount</th>
                  <th className="py-2 pr-4">Delivery</th>
                  <th className="py-2 pr-4">Payment</th>
                  <th className="py-2 pr-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(list?.distributions ?? []).map((d: DistributionRow) => (
                  <tr key={d.id} className="border-t">
                    <td className="py-2 pr-4">{d.shop?.name}</td>
                    <td className="py-2 pr-4">{d.retailerProduct?.product?.name}</td>
                    <td className="py-2 pr-4">{d.quantity}</td>
                    <td className="py-2 pr-4">₹{d.totalAmount?.toLocaleString?.()}</td>
                    <td className="py-2 pr-4">{d.deliveryStatus}</td>
                    <td className="py-2 pr-4">{d.paymentStatus}</td>
                    <td className="py-2 pr-4">
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline" onClick={() => { setDeliveryForm({ status: "DELIVERED" }); }}>Delivery</Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Update Delivery Status</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-3">
                              <select className="w-full border rounded-md p-2" value={deliveryForm.status} onChange={(e) => setDeliveryForm(f => ({ ...f, status: e.target.value }))}>
                                {['PENDING','SHIPPED','IN_TRANSIT','DELIVERED','RETURNED','CANCELLED'].map(s => <option key={s} value={s}>{s}</option>)}
                              </select>
                              <input className="w-full border rounded-md p-2" type="datetime-local" onChange={(e) => setDeliveryForm(f => ({ ...f, date: e.target.value }))} />
                              <input className="w-full border rounded-md p-2" placeholder="Tracking Number" onChange={(e) => setDeliveryForm(f => ({ ...f, tracking: e.target.value }))} />
                              <div className="flex justify-end">
                                <Button
                                  onClick={async () => {
                                    try {
                                      await RetailerAPI.updateDeliveryStatus(d.id, {
                                        deliveryStatus: deliveryForm.status,
                                        deliveryDate: deliveryForm.date ? new Date(deliveryForm.date).toISOString() : undefined,
                                        trackingNumber: deliveryForm.tracking || undefined,
                                      });
                                      const refreshed = await RetailerAPI.distributions({ page: 1, limit: 20 });
                                      setList(refreshed as { distributions: DistributionRow[] });
                                    } catch {
                                      // silently ignore and keep dialog open
                                    }
                                  }}
                                >Save</Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline" onClick={() => { setPaymentForm({ status: "PAID" }); }}>Payment</Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Update Payment Status</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-3">
                              <select className="w-full border rounded-md p-2" value={paymentForm.status} onChange={(e) => setPaymentForm(f => ({ ...f, status: e.target.value }))}>
                                {['PENDING','PAID','PARTIAL','OVERDUE','CANCELLED'].map(s => <option key={s} value={s}>{s}</option>)}
                              </select>
                              <input className="w-full border rounded-md p-2" type="datetime-local" onChange={(e) => setPaymentForm(f => ({ ...f, date: e.target.value }))} />
                              <div className="flex justify-end">
                                <Button
                                  onClick={async () => {
                                    try {
                                      await RetailerAPI.updatePaymentStatus(d.id, {
                                        paymentStatus: paymentForm.status,
                                        paidDate: paymentForm.date ? new Date(paymentForm.date).toISOString() : undefined,
                                      });
                                      const refreshed = await RetailerAPI.distributions({ page: 1, limit: 20 });
                                      setList(refreshed as { distributions: DistributionRow[] });
                                    } catch {
                                      // silently ignore and keep dialog open
                                    }
                                  }}
                                >Save</Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between mt-4 text-sm">
            <div>Page {page}</div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => fetchData(page - 1)}>Prev</Button>
              <Button variant="outline" size="sm" onClick={() => fetchData(page + 1)}>Next</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
