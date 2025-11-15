import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { StaffAPI } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Alert } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUpDown, RefreshCcw, ArrowLeft, Download } from "lucide-react";

interface CompanyProduct {
  id: number;
  name: string;
  barcode?: string;
  sku?: string;
  basePrice?: number;
  currentStock?: number;
  eyewearType?: string;
  material?: string;
  color?: string;
  company?: { id: number; name: string };
}

type SortKey = "name" | "basePrice" | "currentStock";

const CompanyProductsPage: React.FC = () => {
  const { companyId } = useParams();
  const cid = Number(companyId);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<CompanyProduct[]>([]);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [companyName, setCompanyName] = useState<string>("");

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const fetchProducts = useCallback(async () => {
    if (!cid || isNaN(cid)) {
      setError("Invalid company id");
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const res = await StaffAPI.inventory.getCompanyProducts(cid);
      const list = Array.isArray(res) ? res : res?.items || res?.products || [];
      setProducts(list);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(
        error?.response?.data?.message || "Failed to load company products"
      );
    } finally {
      setLoading(false);
    }
  }, [cid]);

  // fetch company name via getCompanies fallback
  useEffect(() => {
    const fetchName = async () => {
      try {
        const comps = await StaffAPI.inventory.getCompanies();
        const arr = Array.isArray(comps) ? comps : comps?.items || [];
        const found = arr.find((c: any) => c.id === cid);
        if (found) setCompanyName(found.name || "Company");
      } catch {
        /* ignore */
      }
    };
    fetchName();
  }, [cid]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const filtered = useMemo(() => {
    let list = [...products];
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.barcode?.toLowerCase().includes(q) ||
          p.sku?.toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      const av = (a as any)[sortKey];
      const bv = (b as any)[sortKey];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return list;
  }, [products, search, sortKey, sortDir]);

  const stats = useMemo(() => {
    const totalProducts = products.length;
    let lowStock = 0;
    let zeroStock = 0;
    let totalInventoryValue = 0;
    let totalUnits = 0;
    products.forEach((p) => {
      if (p.currentStock != null) {
        if (p.currentStock <= 0) zeroStock++;
        else if (p.currentStock < 5) lowStock++;
        totalUnits += p.currentStock;
        if (p.basePrice != null)
          totalInventoryValue += p.basePrice * p.currentStock;
      }
    });
    return {
      totalProducts,
      lowStock,
      zeroStock,
      totalUnits,
      totalInventoryValue,
    };
  }, [products]);

  const exportCSV = () => {
    const headers = [
      "ID",
      "Name",
      "Barcode",
      "SKU",
      "Price",
      "Stock",
      "Type",
      "Material",
      "Color",
    ];
    const rows = filtered.map((p) => [
      p.id,
      p.name,
      p.barcode || "",
      p.sku || "",
      p.basePrice ?? "",
      p.currentStock ?? "",
      p.eyewearType || "",
      p.material || "",
      p.color || "",
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `company-${cid}-products.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <div className="text-sm text-muted-foreground">
          Inventory / Companies / {companyName || "…"} / Products
        </div>
      </div>

      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-xl font-semibold">
            {companyName || "Company"} Products
          </h1>
          <p className="text-xs text-muted-foreground">
            Products associated with this company
          </p>
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <Input
            placeholder="Search by name / barcode / SKU"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64"
          />
          <Button
            size="sm"
            variant="outline"
            onClick={() => fetchProducts()}
            disabled={loading}
          >
            <RefreshCcw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={exportCSV}
            disabled={filtered.length === 0}
          >
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
          <Button
            size="sm"
            onClick={() =>
              navigate(
                `/staff-dashboard/inventory/products/create?companyId=${cid}`
              )
            }
          >
            Add Product
          </Button>
        </div>
      </div>

      {/* Analytics */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-5">
        <Card className="p-3 text-center space-y-1">
          <div className="text-xs text-muted-foreground">Products</div>
          <div className="text-lg font-semibold">{stats.totalProducts}</div>
        </Card>
        <Card className="p-3 text-center space-y-1">
          <div className="text-xs text-muted-foreground">Low Stock (&lt;5)</div>
          <div className="text-lg font-semibold">{stats.lowStock}</div>
        </Card>
        <Card className="p-3 text-center space-y-1">
          <div className="text-xs text-muted-foreground">Out of Stock</div>
          <div className="text-lg font-semibold">{stats.zeroStock}</div>
        </Card>
        <Card className="p-3 text-center space-y-1">
          <div className="text-xs text-muted-foreground">Units</div>
          <div className="text-lg font-semibold">{stats.totalUnits}</div>
        </Card>
        <Card className="p-3 text-center space-y-1">
          <div className="text-xs text-muted-foreground">Value</div>
          <div className="text-lg font-semibold">
            ₹{stats.totalInventoryValue.toFixed(2)}
          </div>
        </Card>
      </div>

      <Card className="p-4 space-y-4">
        {error && <Alert variant="destructive">{error}</Alert>}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>{filtered.length} shown</span>
        </div>
        <Separator />
        {loading ? (
          <Skeleton className="h-48 w-full" />
        ) : filtered.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">
            No products for this company.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground">
                  <th
                    className="py-2 pr-4 cursor-pointer"
                    onClick={() => toggleSort("name")}
                  >
                    Name <ArrowUpDown className="inline h-3 w-3" />
                  </th>
                  <th className="py-2 pr-4">Barcode</th>
                  <th className="py-2 pr-4">SKU</th>
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
                  <th className="py-2 pr-4">Type</th>
                  <th className="py-2 pr-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} className="border-t">
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
                    <td className="py-2 pr-4">{p.barcode || "—"}</td>
                    <td className="py-2 pr-4">{p.sku || "—"}</td>
                    <td className="py-2 pr-4">
                      {p.basePrice != null ? `₹${p.basePrice.toFixed(2)}` : "—"}
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
                    <td className="py-2 pr-4">{p.eyewearType || "—"}</td>
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
          </div>
        )}
      </Card>
    </div>
  );
};

export default CompanyProductsPage;
