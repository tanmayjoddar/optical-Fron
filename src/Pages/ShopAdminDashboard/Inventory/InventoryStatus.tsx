import { useEffect, useMemo, useState } from "react";
import { ShopAdminAPI } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Pagination from "../Pagination/Pagination";

type StatusItem = {
  id?: number | string;
  productId?: number;
  name?: string;
  productName?: string;
  sku?: string;
  barcode?: string;
  stock?: number;
  quantity?: number;
  reorderLevel?: number;
  updatedAt?: string;
  [k: string]: any;
};

type StatusResponse = {
  summary?: { totalProducts?: number; totalStock?: number; lowStock?: number; [k: string]: any } | StatusItem[];
  items?: StatusItem[];
  inventory?: StatusItem[];
  data?: StatusItem[];
  pagination?: { page?: number; limit?: number; total?: number; totalPages?: number };
  [k: string]: any;
};

export default function InventoryStatus() {
  const [items, setItems] = useState<StatusItem[]>([]);
  const [summary, setSummary] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [lowStock, setLowStock] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<string>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [search, setSearch] = useState<string>("");

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res: StatusResponse | any = await ShopAdminAPI.inventory.getStatus({ page, limit, lowStock, sortBy, sortOrder, search: search || undefined });
      const list: StatusItem[] = Array.isArray(res?.items)
        ? res.items
        : Array.isArray(res?.inventory)
          ? res.inventory
          : Array.isArray(res?.data)
            ? res.data
            : Array.isArray(res)
              ? res
              : [];
      let sum: any = res?.summary;
      if (Array.isArray(sum)) {
        sum = sum.reduce((acc: any, cur: any) => ({ ...acc, ...cur }), {});
      }
      setItems(list);
      setSummary(sum || null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalStock = useMemo(() => items.reduce((s, it) => s + (it.stock ?? it.quantity ?? 0), 0), [items]);
  const lowStockCount = useMemo(() => items.filter(it => (it.reorderLevel ?? 0) > 0 && (it.stock ?? it.quantity ?? 0) <= (it.reorderLevel ?? 0)).length, [items]);

  return (
    <div className="max-w-6xl mx-auto">
      <Card className="mb-4 p-4">
        <h2 className="font-bold mb-3">Inventory Status (Management)</h2>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
          <div className="md:col-span-3">
            <label className="text-sm text-muted-foreground">Search</label>
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name, SKU or barcode" />
          </div>
          <div className="md:col-span-2">
            <label className="text-sm text-muted-foreground">Low Stock Only</label>
            <Select value={lowStock ? "true" : "false"} onValueChange={(v: string) => setLowStock(v === "true")}> 
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="false">No</SelectItem>
                <SelectItem value="true">Yes</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2">
            <label className="text-sm text-muted-foreground">Sort By</label>
            <Select value={sortBy} onValueChange={(v: string) => setSortBy(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="stock">Stock</SelectItem>
                <SelectItem value="updatedAt">Updated At</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2">
            <label className="text-sm text-muted-foreground">Order</label>
              <Select value={sortOrder} onValueChange={(v: string) => setSortOrder((v as 'asc' | 'desc'))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="asc">ASC</SelectItem>
                <SelectItem value="desc">DESC</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-1">
            <label className="text-sm text-muted-foreground">Page</label>
            <Input type="number" min={1} value={page} onChange={(e) => setPage(Math.max(1, Number(e.target.value)))} />
          </div>
          <div className="md:col-span-1">
            <label className="text-sm text-muted-foreground">Limit</label>
            <Input type="number" min={1} max={200} value={limit} onChange={(e) => setLimit(Math.max(1, Number(e.target.value)))} />
          </div>
          <div className="md:col-span-1">
            <Button onClick={() => { setPage(1); load(); }} disabled={loading}>{loading ? 'Loading...' : 'Apply'}</Button>
          </div>
        </div>
      </Card>

      {error && <Card className="mb-4 p-4 text-red-600">{error}</Card>}

      <div className="grid md:grid-cols-3 gap-4 mb-4">
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Total Products</div>
          <div className="text-2xl font-semibold">{summary?.totalProducts ?? items.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Total Stock</div>
          <div className="text-2xl font-semibold">{summary?.totalStock ?? totalStock}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Low Stock Items</div>
          <div className="text-2xl font-semibold">{summary?.lowStock ?? lowStockCount}</div>
        </Card>
      </div>

      <Card className="p-4 mb-6">
        <h3 className="font-semibold mb-2">Inventory</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>SKU</th>
                <th>Barcode</th>
                <th>Stock</th>
                <th>Reorder</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={String(it.id ?? it.productId ?? Math.random())} className="border-b">
                  <td>{it.id ?? it.productId ?? '—'}</td>
                  <td>{it.name ?? it.productName ?? '—'}</td>
                  <td>{it.sku ?? '—'}</td>
                  <td>{it.barcode ?? '—'}</td>
                  <td>{it.stock ?? it.quantity ?? 0}</td>
                  <td>{it.reorderLevel ?? '—'}</td>
                  <td>{it.updatedAt ? new Date(it.updatedAt).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center text-muted-foreground py-6">No data</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Client-side pagination helper if server doesn't paginate visually. We still use server params above. */}
        <div className="mt-4">
          <Pagination page={page} totalPages={Math.max(1, Math.ceil((summary?.totalProducts ?? items.length) / limit))} onPageChange={(p) => { setPage(p); load(); }} />
        </div>
      </Card>
    </div>
  );
}
