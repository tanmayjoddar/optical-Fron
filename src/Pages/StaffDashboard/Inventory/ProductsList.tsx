import React, { useCallback, useEffect, useMemo, useState } from "react";
import { StaffAPI } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { useNavigate } from "react-router";
import {
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Filter,
  Layers,
  CheckSquare,
} from "lucide-react";
import { formatCurrency } from "@/lib/currency";

interface ProductRow {
  id: number;
  name: string;
  barcode?: string;
  sku?: string;
  basePrice?: number;
  currentStock?: number;
  company?: { id: number; name: string };
  eyewearType?: string;
  material?: string;
  color?: string;
}

const pageSizeOptions = [10, 20, 50];

type SortKey = "name" | "basePrice" | "currentStock";

const ProductsList: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await StaffAPI.inventory.getProducts({
        page,
        limit,
        search: search || undefined,
      });
      // Handle multiple response formats from API
      let productList: ProductRow[] = [];
      let totalCount = 0;

      if (Array.isArray(res)) {
        // Response is array directly
        productList = res as ProductRow[];
        totalCount = res.length;
      } else if (res?.products) {
        // Response has { products, pagination, ... }
        productList = res.products as ProductRow[];
        totalCount = res?.pagination?.totalProducts || res.products.length;
      } else if (res?.items) {
        // Response has { items, total, ... }
        productList = res.items as ProductRow[];
        totalCount = res?.total || res.items.length;
      } else {
        // Fallback: try to extract any array-like data
        productList = [];
        totalCount = 0;
      }

      setProducts(productList);
      setTotal(totalCount);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error?.response?.data?.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  }, [page, limit, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const sortedProducts = useMemo(() => {
    const copy = [...products];
    copy.sort((a, b) => {
      const av = (a as unknown as Record<string, unknown>)[sortKey];
      const bv = (b as unknown as Record<string, unknown>)[sortKey];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return copy;
  }, [products, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const toggleSelect = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allSelected =
    selected.size > 0 && products.every((p) => selected.has(p.id));
  const toggleSelectAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(products.map((p) => p.id)));
  };

  return (
    <div className="space-y-6 p-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="text-muted-foreground text-sm">
            Browse and manage all products
          </p>
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <Input
            placeholder="Search by name, barcode, SKU"
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
            className="w-56"
          />
          <Button variant="outline" onClick={() => fetchData()}>
            Refresh
          </Button>
          <Button variant="outline" disabled>
            <Filter className="h-4 w-4 mr-1" /> Filters (Future)
          </Button>
          <Button variant="outline" disabled>
            <Layers className="h-4 w-4 mr-1" /> Columns (Future)
          </Button>
          <Button
            onClick={() => navigate("/staff-dashboard/inventory/products/new")}
          >
            Add Product
          </Button>
        </div>
      </div>

      <Card className="p-4 space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <div className="flex flex-wrap gap-4 items-center text-sm">
          <div className="flex items-center gap-2">
            <span>Page Size:</span>
            <select
              className="border rounded px-2 py-1 bg-background"
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
          <div className="text-xs text-muted-foreground">Total: {total}</div>
          {selected.size > 0 && (
            <div className="flex gap-2 items-center text-xs bg-muted px-2 py-1 rounded">
              <CheckSquare className="h-3 w-3" /> {selected.size} selected
              <Button size="sm" variant="outline" disabled>
                Bulk Edit (Future)
              </Button>
              <Button size="sm" variant="outline" disabled>
                Bulk Delete (Future)
              </Button>
              <Button size="sm" variant="outline" disabled>
                Bulk Stock Update (Future)
              </Button>
            </div>
          )}
        </div>
        <Separator />
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          {loading ? (
            <Skeleton className="h-48 w-full" />
          ) : products.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              No products found.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground text-left">
                  <th className="py-2 pr-4">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th
                    className="py-2 pr-4 cursor-pointer"
                    onClick={() => toggleSort("name")}
                  >
                    Name <ArrowUpDown className="inline h-3 w-3" />
                  </th>
                  <th className="py-2 pr-4">Company</th>
                  <th className="py-2 pr-4">Type</th>
                  <th className="py-2 pr-4">Barcode</th>
                  <th
                    className="py-2 pr-4 cursor-pointer"
                    onClick={() => toggleSort("basePrice")}
                  >
                    Price <ArrowUpDown className="inline h-3 w-3" />
                  </th>
                  <th
                    className="py-2 pr-4 cursor-pointer"
                    onClick={() => toggleSort("currentStock")}
                  >
                    Stock <ArrowUpDown className="inline h-3 w-3" />
                  </th>
                  <th className="py-2 pr-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedProducts.map((p) => (
                  <tr key={p.id} className="border-t">
                    <td className="py-2 pr-4">
                      <input
                        type="checkbox"
                        checked={selected.has(p.id)}
                        onChange={() => toggleSelect(p.id)}
                      />
                    </td>
                    <td className="py-2 pr-4">
                      <button
                        className="text-blue-600 hover:underline"
                        onClick={() =>
                          navigate(
                            `/staff-dashboard/inventory/products/${p.id}`
                          )
                        }
                      >
                        {p.name}
                      </button>
                    </td>
                    <td className="py-2 pr-4">{p.company?.name}</td>
                    <td className="py-2 pr-4">{p.eyewearType}</td>
                    <td className="py-2 pr-4">{p.barcode}</td>
                    <td className="py-2 pr-4">
                      {p.basePrice != null ? formatCurrency(p.basePrice) : "—"}
                    </td>
                    <td className="py-2 pr-4">
                      <span
                        className={`px-2 py-0.5 rounded text-xs ${
                          p.currentStock == null
                            ? "bg-gray-200 text-gray-700"
                            : p.currentStock <= 0
                            ? "bg-red-600 text-white"
                            : p.currentStock < 5
                            ? "bg-orange-500 text-white"
                            : "bg-green-600 text-white"
                        }`}
                      >
                        {p.currentStock ?? "—"}
                      </span>
                    </td>
                    <td className="py-2 pr-4">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            navigate(
                              `/staff-dashboard/inventory/quick-stock?productId=${p.id}`
                            )
                          }
                          disabled
                        >
                          Stock +
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            navigate(
                              `/staff-dashboard/inventory/stock-out?productId=${p.id}`
                            )
                          }
                          disabled
                        >
                          Stock -
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Mobile Cards */}
        <div className="grid gap-3 md:hidden">
          {loading ? (
            <Skeleton className="h-48 w-full" />
          ) : products.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              No products found.
            </div>
          ) : (
            sortedProducts.map((p) => (
              <Card key={p.id} className="p-4 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <button
                      className="text-left font-medium hover:underline"
                      onClick={() =>
                        navigate(`/staff-dashboard/inventory/products/${p.id}`)
                      }
                    >
                      {p.name}
                    </button>
                    <div className="text-xs text-muted-foreground space-x-1">
                      {p.barcode && <span>{p.barcode}</span>}
                      {p.sku && <span>• {p.sku}</span>}
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={selected.has(p.id)}
                    onChange={() => toggleSelect(p.id)}
                  />
                </div>
                <div className="flex flex-wrap gap-3 text-xs">
                  {p.company?.name && <span>{p.company.name}</span>}
                  {p.eyewearType && <span>{p.eyewearType}</span>}
                  <span
                    className={`px-2 py-0.5 rounded ${
                      p.currentStock == null
                        ? "bg-gray-200 text-gray-700"
                        : p.currentStock <= 0
                        ? "bg-red-600 text-white"
                        : p.currentStock < 5
                        ? "bg-orange-500 text-white"
                        : "bg-green-600 text-white"
                    }`}
                  >
                    {p.currentStock ?? "—"}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <div>
                    {p.basePrice != null ? formatCurrency(p.basePrice) : "—"}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" disabled>
                      +
                    </Button>
                    <Button size="sm" variant="outline" disabled>
                      -
                    </Button>
                  </div>
                </div>
              </Card>
            ))
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
    </div>
  );
};

export default ProductsList;
