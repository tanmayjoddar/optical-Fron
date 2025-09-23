import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RetailerAPI } from "@/lib/retailerApi";

export default function RetailerShops() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  type ShopStats = { totalDistributions?: number; pendingPayments?: number; totalQuantityDistributed?: number; totalAmountDistributed?: number }
  type ShopRow = { id: number; shop?: { name?: string; address?: string } | null; stats?: ShopStats | null }
  type Performance = { totalShops?: number; topPerformingShop?: { name?: string; revenue?: number } | null; averageRevenuePerShop?: number }
  const [shops, setShops] = useState<ShopRow[]>([]);
  const [performance, setPerformance] = useState<Performance | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const [data, perf]: [ShopRow[], Performance] = await Promise.all([
          RetailerAPI.shops(),
          RetailerAPI.shopPerformance({ period: 'month' }),
        ]);
        if (!mounted) return;
        setShops(data || []);
        setPerformance(perf || null);
      } catch (e) {
        const message = typeof e === 'object' && e && 'message' in e ? String((e as { message?: unknown }).message) : undefined;
        setError(message || "Failed to load shops");
      } finally {
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  if (loading) {
    return (
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card className="glass-card" key={i}>
            <CardHeader><CardTitle className="text-sm"><Skeleton className="h-4 w-40"/></CardTitle></CardHeader>
            <CardContent><Skeleton className="h-16 w-full"/></CardContent>
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
        <h2 className="text-2xl font-semibold text-brand-gradient">Shops</h2>
        <p className="text-muted-foreground">Your network and performance</p>
      </div>

      {performance && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-brand-gradient">Monthly Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="clay p-4 rounded-lg">
                <div className="text-xs text-muted-foreground">Total Shops</div>
                <div className="text-xl font-semibold">{performance.totalShops}</div>
              </div>
              <div className="clay p-4 rounded-lg">
                <div className="text-xs text-muted-foreground">Top Shop</div>
                <div className="text-xl font-semibold">{performance.topPerformingShop?.name}</div>
              </div>
              <div className="clay p-4 rounded-lg">
                <div className="text-xs text-muted-foreground">Top Revenue</div>
                <div className="text-xl font-semibold">₹{performance.topPerformingShop?.revenue?.toLocaleString?.()}</div>
              </div>
              <div className="clay p-4 rounded-lg">
                <div className="text-xs text-muted-foreground">Avg Revenue/Shop</div>
                <div className="text-xl font-semibold">₹{performance.averageRevenuePerShop?.toLocaleString?.()}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
  {shops.map((rs: ShopRow) => (
          <Card key={rs.id} className="glass-card">
            <CardHeader>
              <CardTitle className="text-base">{rs.shop?.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">{rs.shop?.address}</div>
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div className="clay p-3 rounded-lg">
                  <div className="text-xs">Total Distributions</div>
                  <div className="font-semibold">{rs.stats?.totalDistributions ?? 0}</div>
                </div>
                <div className="clay p-3 rounded-lg">
                  <div className="text-xs">Pending Payments</div>
                  <div className="font-semibold">₹{rs.stats?.pendingPayments?.toLocaleString?.() ?? 0}</div>
                </div>
                <div className="clay p-3 rounded-lg">
                  <div className="text-xs">Quantity</div>
                  <div className="font-semibold">{rs.stats?.totalQuantityDistributed ?? 0}</div>
                </div>
                <div className="clay p-3 rounded-lg">
                  <div className="text-xs">Amount</div>
                  <div className="font-semibold">₹{rs.stats?.totalAmountDistributed?.toLocaleString?.() ?? 0}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
