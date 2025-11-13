import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { StaffAPI } from "@/lib/api";
import { Plus, RefreshCw, PackageCheck } from "lucide-react";

type Receipt = {
  id: number;
  product?: { name?: string; sku?: string; company?: { name?: string } } | null;
  productId?: number;
  receivedQuantity: number;
  supplierName?: string;
  status?: string;
  batchNumber?: string;
  deliveryNote?: string;
  createdAt?: string;
};
type ReceiptList = { receipts?: Receipt[]; summary?: unknown };
export default function StockReceipts() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("");
  const [list, setList] = useState<ReceiptList>({ receipts: [], summary: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
  const res = (await StaffAPI.stockReceipts.getAll({ status: status || undefined })) as ReceiptList;
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

  const getStatusBadge = (status?: string) => {
    switch (status?.toUpperCase()) {
      case 'PENDING':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">Pending</Badge>;
      case 'APPROVED':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">Approved</Badge>;
      case 'REJECTED':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">Rejected</Badge>;
      case 'COMPLETED':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">Completed</Badge>;
      default:
        return <Badge variant="outline">{status || 'Unknown'}</Badge>;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <PackageCheck className="h-7 w-7" />
            Stock Receipts
          </h1>
          <p className="text-gray-600">Track incoming stock waiting for approval</p>
        </div>
        <Button onClick={() => navigate("/staff-dashboard/stock-receipts/create")}>
          <Plus className="h-4 w-4 mr-2" />
          New Receipt
        </Button>
      </div>

      <Card className="glass-card">
        <CardHeader><CardTitle>Filters</CardTitle></CardHeader>
        <CardContent className="flex gap-2 items-center">
          <select 
            className="border rounded-md p-2 min-w-[150px]" 
            value={status} 
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">All Status</option>
            {['PENDING','APPROVED','REJECTED','COMPLETED'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <Button variant="outline" onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Receipts ({(list.receipts ?? []).length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : error ? (
            <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>
          ) : (list.receipts ?? []).length === 0 ? (
            <div className="text-center py-12">
              <PackageCheck className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 mb-4">No stock receipts found</p>
              <Button onClick={() => navigate("/staff-dashboard/stock-receipts/create")}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Receipt
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground border-b">
                    <th className="py-3 pr-4 font-medium">ID</th>
                    <th className="py-3 pr-4 font-medium">Product</th>
                    <th className="py-3 pr-4 font-medium">Quantity</th>
                    <th className="py-3 pr-4 font-medium">Supplier</th>
                    <th className="py-3 pr-4 font-medium">Batch</th>
                    <th className="py-3 pr-4 font-medium">Date</th>
                    <th className="py-3 pr-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(list.receipts ?? []).map((r: Receipt) => (
                    <tr key={r.id} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="py-3 pr-4 font-medium">#{r.id}</td>
                      <td className="py-3 pr-4">
                        <div>
                          <div className="font-medium">{r.product?.name || `Product #${r.productId}`}</div>
                          {r.product?.sku && (
                            <div className="text-xs text-gray-500">SKU: {r.product.sku}</div>
                          )}
                          {r.product?.company?.name && (
                            <div className="text-xs text-gray-500">{r.product.company.name}</div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        <span className="font-medium">{r.receivedQuantity}</span> units
                      </td>
                      <td className="py-3 pr-4">{r.supplierName || '-'}</td>
                      <td className="py-3 pr-4">
                        {r.batchNumber ? (
                          <span className="text-xs bg-gray-100 px-2 py-1 rounded">{r.batchNumber}</span>
                        ) : '-'}
                      </td>
                      <td className="py-3 pr-4 text-gray-600">{formatDate(r.createdAt)}</td>
                      <td className="py-3 pr-4">{getStatusBadge(r.status)}</td>
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
