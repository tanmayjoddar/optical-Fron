import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TrendingUp, Package, Store, ChartColumn } from "lucide-react";
import { RetailerAPI } from "@/lib/retailerApi";

type TopProduct = { product?: { name?: string; company?: { name?: string } } | null; soldQuantity?: number; revenue?: number }
type SalesByShop = { shop?: { name?: string } | null; revenue?: number; quantity?: number; orderCount?: number }
type OverviewData = {
  salesSummary?: {
    today?: { totalSales?: number; orderCount?: number };
    thisMonth?: { totalSales?: number; orderCount?: number };
  };
  inventoryStatus?: { totalStock?: number; totalProducts?: number };
  monthlyOverview?: { activeShops?: number; distributionCount?: number };
  topProducts?: TopProduct[];
}
type SalesData = { salesByShop?: SalesByShop[] }

export default function RetailerOverview() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [sales, setSales] = useState<SalesData | null>(null);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      try {
        setLoading(true);
        const [ov, sa]: [OverviewData, SalesData] = await Promise.all([
          RetailerAPI.overview(),
          RetailerAPI.salesAnalytics({ period: "month" }),
        ]);
        if (!mounted) return;
        setOverview(ov);
        setSales(sa);
      } catch (e) {
        const message = typeof e === "object" && e && "message" in e ? String((e as { message?: unknown }).message) : undefined;
        setError(message || "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };
    run();
    return () => {
      mounted = false;
    };
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
        <h2 className="text-2xl font-semibold text-brand-gradient">Overview</h2>
        <p className="text-muted-foreground">Your business at a glance</p>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Today's Sales</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{overview?.salesSummary?.today?.totalSales?.toLocaleString?.() ?? 0}</div>
            <p className="text-xs text-muted-foreground">Orders: {overview?.salesSummary?.today?.orderCount ?? 0}</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <ChartColumn className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{overview?.salesSummary?.thisMonth?.totalSales?.toLocaleString?.() ?? 0}</div>
            <p className="text-xs text-muted-foreground">Orders: {overview?.salesSummary?.thisMonth?.orderCount ?? 0}</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Inventory</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.inventoryStatus?.totalStock ?? 0}</div>
            <p className="text-xs text-muted-foreground">Products: {overview?.inventoryStatus?.totalProducts ?? 0}</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Shops</CardTitle>
            <Store className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.monthlyOverview?.activeShops ?? 0}</div>
            <p className="text-xs text-muted-foreground">Distributions: {overview?.monthlyOverview?.distributionCount ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="top-products" className="w-full">
        <TabsList className="glass-card">
          <TabsTrigger value="top-products">Top Products</TabsTrigger>
          <TabsTrigger value="sales-by-shop">Sales by Shop</TabsTrigger>
        </TabsList>
        <TabsContent value="top-products" className="mt-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-brand-gradient">Top Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-muted-foreground">
                      <th className="py-2 pr-4">Product</th>
                      <th className="py-2 pr-4">Company</th>
                      <th className="py-2 pr-4">Sold</th>
                      <th className="py-2 pr-4">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {overview?.topProducts?.map((tp: TopProduct, idx: number) => (
                      <tr key={idx} className="border-t">
                        <td className="py-2 pr-4">{tp.product?.name}</td>
                        <td className="py-2 pr-4">{tp.product?.company?.name}</td>
                        <td className="py-2 pr-4">{tp.soldQuantity}</td>
                        <td className="py-2 pr-4">₹{tp.revenue?.toLocaleString?.()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="sales-by-shop" className="mt-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-brand-gradient">Sales by Shop (month)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-muted-foreground">
                      <th className="py-2 pr-4">Shop</th>
                      <th className="py-2 pr-4">Revenue</th>
                      <th className="py-2 pr-4">Qty</th>
                      <th className="py-2 pr-4">Orders</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sales?.salesByShop?.map((s: SalesByShop, idx: number) => (
                      <tr key={idx} className="border-t">
                        <td className="py-2 pr-4">{s.shop?.name}</td>
                        <td className="py-2 pr-4">₹{s.revenue?.toLocaleString?.()}</td>
                        <td className="py-2 pr-4">{s.quantity}</td>
                        <td className="py-2 pr-4">{s.orderCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
