import { useEffect, useMemo, useState } from "react";
import { ShopAdminAPI } from "@/lib/api";
import Pagination from "../Pagination/Pagination";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type LowStockItem = {
  product?: { id: number; name: string; sku: string; category: string };
  id?: number;
  name?: string;
  sku?: string;
  category?: string;
  currentStock?: number;
  alertLevel?: number;
  lastUpdated?: string;
  [key: string]: unknown;
};

export default function LowStockAlerts() {
  const [alerts, setAlerts] = useState<LowStockItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [onlyLowStock, setOnlyLowStock] = useState(true);

  const [page, setPage] = useState(1);
  const pageSize = 10;

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await ShopAdminAPI.reports.getInventoryAlerts();
      console.log("Low Stock Alerts Response:", res);
      
      // Accept multiple response formats
      let list: LowStockItem[] = [];
      if (Array.isArray(res)) {
        list = res;
      } else if (res?.alerts && Array.isArray(res.alerts)) {
        list = res.alerts;
      } else if (res?.data && Array.isArray(res.data)) {
        list = res.data;
      } else if (res?.inventory && Array.isArray(res.inventory)) {
        list = res.inventory;
      } else {
        // Try to find any array in the response
        for (const key in res) {
          if (Array.isArray(res[key])) {
            list = res[key];
            break;
          }
        }
      }
      
      console.log("Parsed Low Stock Items:", list);
      setAlerts(list);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("Error loading low stock alerts:", msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return alerts.filter((a) => {
      // Get values from nested or flat structure
      const name = (a.product?.name || a.name || "").toLowerCase();
      const sku = (a.product?.sku || a.sku || "").toLowerCase();
      const category = (a.product?.category || a.category || "").toLowerCase();
      const current = a.currentStock ?? 0;
      const alert = a.alertLevel ?? 0;
      
      // If onlyLowStock is true, filter by stock level; if false, show all
      const stockOk = !onlyLowStock || (current <= alert);
      const textOk = q === "" ||
        name.includes(q) ||
        sku.includes(q) ||
        category.includes(q);
      return stockOk && textOk;
    });
  }, [alerts, query, onlyLowStock]);

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="p-4 mb-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="font-bold text-lg">Low Stock Alerts</h2>
            <p className="text-sm text-muted-foreground">Products at or below their alert level.</p>
          </div>
          <div className="flex gap-2 items-center">
            <Input placeholder="Search by name, SKU, category" value={query} onChange={(e) => { setPage(1); setQuery(e.target.value); }} className="w-64" />
            <Button variant={onlyLowStock ? "default" : "outline"} onClick={() => { setPage(1); setOnlyLowStock(!onlyLowStock); }}>
              {onlyLowStock ? "Showing Low Only" : "Include All"}
            </Button>
            <Button onClick={() => load()} disabled={loading}>{loading ? "Refreshing..." : "Refresh"}</Button>
          </div>
        </div>
      </Card>

      {error && (
        <Card className="p-4 mb-4 text-red-600">{error}</Card>
      )}

      <Card className="p-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Category</th>
                <th>Current</th>
                <th>Alert</th>
                <th>Status</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={7} className="py-6 text-center text-muted-foreground">Loading...</td></tr>
              )}
              {!loading && paginated.map((item: LowStockItem) => {
                const productId = item.product?.id || item.id || 0;
                const name = item.product?.name || item.name || "—";
                const sku = item.product?.sku || item.sku || "—";
                const category = item.product?.category || item.category || "—";
                const current = item.currentStock ?? 0;
                const alert = item.alertLevel ?? 0;
                const isLow = current <= alert;
                return (
                  <tr key={productId} className="border-b">
                    <td>{name}</td>
                    <td>{sku}</td>
                    <td>{category}</td>
                    <td>{current}</td>
                    <td>{alert}</td>
                    <td className={isLow ? "text-amber-600" : "text-green-600"}>{isLow ? "Low" : "OK"}</td>
                    <td>{item.lastUpdated ? new Date(item.lastUpdated).toLocaleDateString() : "—"}</td>
                  </tr>
                );
              })}
              {!loading && paginated.length === 0 && (
                <tr><td colSpan={7} className="py-6 text-center text-muted-foreground">No alerts</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-4">
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </Card>
    </div>
  );
}
