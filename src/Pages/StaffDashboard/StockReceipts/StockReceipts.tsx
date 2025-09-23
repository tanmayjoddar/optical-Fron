import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { StaffAPI } from "@/lib/staffApi";

type Receipt = {
  id: number;
  product?: { name?: string } | null;
  productId?: number;
  receivedQuantity: number;
  supplierName?: string;
  status?: string;
};
type ReceiptList = { receipts?: Receipt[]; summary?: unknown };
export default function StockReceipts() {
  const [status, setStatus] = useState("");
  const [list, setList] = useState<ReceiptList>({ receipts: [], summary: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = (await StaffAPI.listStockReceipts({ status: status || undefined })) as ReceiptList;
      setList(res || { receipts: [] });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const fetchRef = useRef(fetchData);
  useEffect(() => { fetchRef.current = fetchData; });
  useEffect(() => { fetchRef.current(); }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stock Receipts</h1>
          <p className="text-gray-600">Track incoming stock waiting for approval</p>
        </div>
      </div>

      <Card className="glass-card">
        <CardHeader><CardTitle>Filters</CardTitle></CardHeader>
        <CardContent className="flex gap-2 items-center">
          <select className="border rounded-md p-2" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All</option>
            {['PENDING','APPROVED','REJECTED','COMPLETED'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <Button variant="outline" onClick={fetchData}>Apply</Button>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader><CardTitle>Receipts</CardTitle></CardHeader>
        <CardContent>
          {loading ? <Skeleton className="h-24 w-full" /> : error ? (
            <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground">
                    <th className="py-2 pr-4">ID</th>
                    <th className="py-2 pr-4">Product</th>
                    <th className="py-2 pr-4">Qty</th>
                    <th className="py-2 pr-4">Supplier</th>
                    <th className="py-2 pr-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(list.receipts ?? []).map((r: Receipt) => (
                    <tr key={r.id} className="border-t">
                      <td className="py-2 pr-4">{r.id}</td>
                      <td className="py-2 pr-4">{r.product?.name || r.productId}</td>
                      <td className="py-2 pr-4">{r.receivedQuantity}</td>
                      <td className="py-2 pr-4">{r.supplierName}</td>
                      <td className="py-2 pr-4">{r.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
