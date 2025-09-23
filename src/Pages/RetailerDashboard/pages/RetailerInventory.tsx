import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RetailerAPI } from "@/lib/retailerApi";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function RetailerInventory() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  type TopCompany = { company?: { name?: string } | null; productCount?: number; totalQuantity?: number; stockValue?: number }
  type Summary = {
    totalProducts?: number; totalQuantity?: number; availableStock?: number; allocatedStock?: number;
    topCompanies?: TopCompany[];
    recentTransactions?: Array<{ id: number; type?: string; product?: { name?: string } | null; quantity?: number; createdAt: string }>
  }
  type LowStockAlert = { product?: { name?: string; company?: { name?: string } } | null; availableStock?: number; reorderLevel?: number; wholesalePrice?: number }
  type Analytics = { lowStockAlerts?: LowStockAlert[] }
  const [summary, setSummary] = useState<Summary | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const [s, a] = await Promise.all([
          RetailerAPI.inventorySummary(),
          RetailerAPI.inventoryAnalytics(),
        ]);
        if (!mounted) return;
        setSummary(s);
        setAnalytics(a);
      } catch (e) {
        const message = typeof e === "object" && e && "message" in e ? String((e as { message?: unknown }).message) : undefined;
        setError(message || "Failed to load inventory summary");
      } finally {
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  if (loading) {
    return (
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card className="glass-card" key={i}>
            <CardHeader>
              <CardTitle className="text-sm font-medium"><Skeleton className="h-4 w-28"/></CardTitle>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-24"/>
              <Skeleton className="h-4 w-32 mt-2"/>
            </CardContent>
          </Card>
        ))}
      </div>
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
        <h2 className="text-2xl font-semibold text-brand-gradient">Inventory</h2>
        <p className="text-muted-foreground">Summary & stock distribution</p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="glass-card">
          <CardHeader><CardTitle className="text-sm">Total Products</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{summary?.totalProducts ?? 0}</div></CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader><CardTitle className="text-sm">Total Quantity</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{summary?.totalQuantity ?? 0}</div></CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader><CardTitle className="text-sm">Available</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{summary?.availableStock ?? 0}</div></CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader><CardTitle className="text-sm">Allocated</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{summary?.allocatedStock ?? 0}</div></CardContent>
        </Card>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-brand-gradient">Top Companies</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground">
                  <th className="py-2 pr-4">Company</th>
                  <th className="py-2 pr-4">Products</th>
                  <th className="py-2 pr-4">Quantity</th>
                  <th className="py-2 pr-4">Stock Value</th>
                </tr>
              </thead>
              <tbody>
                {(summary?.topCompanies ?? []).map((c: TopCompany, idx: number) => (
                  <tr key={idx} className="border-t">
                    <td className="py-2 pr-4">{c.company?.name}</td>
                    <td className="py-2 pr-4">{c.productCount}</td>
                    <td className="py-2 pr-4">{c.totalQuantity}</td>
                    <td className="py-2 pr-4">₹{c.stockValue?.toLocaleString?.()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="transactions" className="w-full">
        <TabsList className="glass-card">
          <TabsTrigger value="transactions">Recent Transactions</TabsTrigger>
          <TabsTrigger value="alerts">Low Stock Alerts</TabsTrigger>
          <TabsTrigger value="products">My Products</TabsTrigger>
          <TabsTrigger value="companies">Companies</TabsTrigger>
        </TabsList>
        <TabsContent value="transactions" className="mt-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-brand-gradient">Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-muted-foreground">
                      <th className="py-2 pr-4">Type</th>
                      <th className="py-2 pr-4">Product</th>
                      <th className="py-2 pr-4">Qty</th>
                      <th className="py-2 pr-4">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(summary?.recentTransactions ?? []).map((t) => (
                      <tr key={t.id} className="border-t">
                        <td className="py-2 pr-4">{t.type}</td>
                        <td className="py-2 pr-4">{t.product?.name}</td>
                        <td className="py-2 pr-4">{t.quantity}</td>
                        <td className="py-2 pr-4">{new Date(t.createdAt).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="alerts" className="mt-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-brand-gradient">Low Stock Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-muted-foreground">
                      <th className="py-2 pr-4">Product</th>
                      <th className="py-2 pr-4">Company</th>
                      <th className="py-2 pr-4">Available</th>
                      <th className="py-2 pr-4">Reorder Level</th>
                      <th className="py-2 pr-4">Wholesale</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(analytics?.lowStockAlerts ?? []).map((a: LowStockAlert, idx: number) => (
                      <tr key={idx} className="border-t">
                        <td className="py-2 pr-4">{a.product?.name}</td>
                        <td className="py-2 pr-4">{a.product?.company?.name}</td>
                        <td className="py-2 pr-4">{a.availableStock}</td>
                        <td className="py-2 pr-4">{a.reorderLevel}</td>
                        <td className="py-2 pr-4">₹{a.wholesalePrice?.toLocaleString?.()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="products" className="mt-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-brand-gradient">My Products</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ProductsTable />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="companies" className="mt-4">
          <Card className="glass-card">
            <CardHeader className="flex items-center justify-between">
              <CardTitle className="text-brand-gradient">Companies</CardTitle>
            </CardHeader>
            <CardContent>
              <CompaniesSection />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ProductsTable() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [eyewearType, setEyewearType] = useState<string>("");
  type ProductRow = {
    id: number;
    product?: { name?: string; company?: { name?: string } } | null;
    availableStock?: number;
    allocatedStock?: number;
    mrp?: number;
    wholesalePrice?: number;
  };
  const [data, setData] = useState<{ products: ProductRow[]; pagination?: unknown }>({ products: [], pagination: null });

  const fetchData = async (page = 1) => {
    try {
      setLoading(true);
      const res = await RetailerAPI.myProducts({
        search: query || undefined,
        eyewearType: (eyewearType as 'GLASSES' | 'SUNGLASSES' | 'LENSES' | '') || undefined,
        page,
        limit: 10,
      });
      setData((res as { products: ProductRow[]; pagination?: unknown }) || { products: [], pagination: null });
    } catch (e) {
      const message = typeof e === "object" && e && "message" in e ? String((e as { message?: unknown }).message) : undefined;
      setError(message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const fetchRef = useRef(fetchData);
  useEffect(() => { fetchRef.current = fetchData; });
  useEffect(() => { fetchRef.current(1); }, []);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Input placeholder="Search name, SKU, barcode" value={query} onChange={(e) => setQuery(e.target.value)} />
        <select className="border rounded-md p-2" value={eyewearType} onChange={(e) => setEyewearType(e.target.value)}>
          <option value="">All types</option>
          <option value="GLASSES">Glasses</option>
          <option value="SUNGLASSES">Sunglasses</option>
          <option value="LENSES">Lenses</option>
        </select>
        <Button onClick={() => fetchData(1)}>Apply</Button>
      </div>

      {loading ? (
        <Skeleton className="h-32 w-full" />
      ) : error ? (
        <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground">
                <th className="py-2 pr-4">Product</th>
                <th className="py-2 pr-4">Company</th>
                <th className="py-2 pr-4">Available</th>
                <th className="py-2 pr-4">Allocated</th>
                <th className="py-2 pr-4">MRP</th>
                <th className="py-2 pr-4">Wholesale</th>
              </tr>
            </thead>
            <tbody>
              {(data.products ?? []).map((p: ProductRow) => (
                <tr key={p.id} className="border-t">
                  <td className="py-2 pr-4">{p.product?.name}</td>
                  <td className="py-2 pr-4">{p.product?.company?.name}</td>
                  <td className="py-2 pr-4">{p.availableStock}</td>
                  <td className="py-2 pr-4">{p.allocatedStock}</td>
                  <td className="py-2 pr-4">₹{p.mrp?.toLocaleString?.()}</td>
                  <td className="py-2 pr-4">₹{p.wholesalePrice?.toLocaleString?.()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function CompaniesSection() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  type CompanyRow = { id: number; name: string; description?: string }
  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [openAdd, setOpenAdd] = useState(false);
  const [newCompany, setNewCompany] = useState({ name: "", description: "" });
  const [edit, setEdit] = useState<{ open: boolean; id?: number; name: string; description: string }>({ open: false, name: "", description: "" });

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const res = await RetailerAPI.companies();
      setCompanies((res as CompanyRow[]) || []);
    } catch (e) {
      const message = typeof e === "object" && e && "message" in e ? String((e as { message?: unknown }).message) : undefined;
      setError(message || "Failed to load companies");
    } finally {
      setLoading(false);
    }
  };

  const fetchCompaniesRef = useRef(fetchCompanies);
  useEffect(() => { fetchCompaniesRef.current = fetchCompanies; });
  useEffect(() => { fetchCompaniesRef.current(); }, []);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={openAdd} onOpenChange={setOpenAdd}>
          <DialogTrigger asChild>
            <Button>Add Company</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Company</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <Input placeholder="Name" value={newCompany.name} onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })} />
              <Input placeholder="Description" value={newCompany.description} onChange={(e) => setNewCompany({ ...newCompany, description: e.target.value })} />
              <div className="flex justify-end">
                <Button onClick={async () => {
                  if (!newCompany.name.trim()) return;
                  try {
                    await RetailerAPI.addCompany({ name: newCompany.name.trim(), description: newCompany.description || undefined });
                    setNewCompany({ name: "", description: "" });
                    setOpenAdd(false);
                    await fetchCompanies();
                  } catch {
                    // No-op: error shown via fetchCompanies on next render if needed
                  }
                }}>Save</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <Skeleton className="h-24 w-full" />
      ) : error ? (
        <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground">
                <th className="py-2 pr-4">Name</th>
                <th className="py-2 pr-4">Description</th>
                <th className="py-2 pr-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {companies.map((c: CompanyRow) => (
                <tr key={c.id} className="border-t">
                  <td className="py-2 pr-4">{c.name}</td>
                  <td className="py-2 pr-4">{c.description}</td>
                  <td className="py-2 pr-4">
                    <Dialog open={edit.open && edit.id === c.id} onOpenChange={(v) => setEdit(v ? { open: true, id: c.id, name: c.name, description: c.description ?? "" } : { open: false, name: "", description: "" })}>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline" onClick={() => setEdit({ open: true, id: c.id, name: c.name, description: c.description ?? "" })}>Edit</Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Update Company</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-3">
                          <Input placeholder="Name" value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} />
                          <Input placeholder="Description" value={edit.description} onChange={(e) => setEdit({ ...edit, description: e.target.value })} />
                          <div className="flex justify-end">
                            <Button onClick={async () => {
                              try {
                                await RetailerAPI.updateCompany(edit.id!, { name: edit.name || undefined, description: edit.description || undefined });
                                setEdit({ open: false, name: "", description: "" });
                                await fetchCompanies();
                              } catch {
                                // No-op: will refresh on next attempt
                              }
                            }}>Save</Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
