import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RetailerAPI } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, TrendingUp, Package, DollarSign } from "lucide-react";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface ShopNetworkStat {
  totalDistributions: number;
  totalQuantityDistributed: number;
  totalAmountDistributed: number;
  pendingDeliveries: number;
  pendingAmount: number;
  lastDistribution?: {
    date: string;
    product: string;
    quantity: number;
    amount: number;
    status: string;
  };
}

interface MyShopNetworkRecord {
  id: number;
  shop: {
    id: number;
    name: string;
    address: string;
    phone: string;
    email: string;
    createdAt: string;
  };
  partnershipType: string;
  joinedAt: string;
  isActive: boolean;
  stats: ShopNetworkStat;
}

interface NetworkAnalyticsData {
  myShops: MyShopNetworkRecord[];
  totalShops: number;
}

const COLORS = [
  "#3b82f6",
  "#ef4444",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
];

export default function NetworkAnalytics() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<NetworkAnalyticsData | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadNetworkData = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const response = await RetailerAPI.shops.myNetwork();
      setData(response as NetworkAnalyticsData);
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Failed to load network analytics";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadNetworkData();
  }, [loadNetworkData]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 rounded-lg" />
        <Skeleton className="h-96 rounded-lg" />
        <Skeleton className="h-96 rounded-lg" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card className="glass-card border-red-200">
        <CardHeader>
          <CardTitle className="text-brand-gradient">
            Network Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error || "Failed to load network analytics"}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const shops = data.myShops || [];
  const totalShops = data.totalShops || shops.length;

  // Calculate network metrics
  const networkMetrics = {
    totalDistributions: shops.reduce(
      (sum, s) => sum + (s.stats?.totalDistributions || 0),
      0
    ),
    totalRevenue: shops.reduce(
      (sum, s) => sum + (s.stats?.totalAmountDistributed || 0),
      0
    ),
    totalQuantity: shops.reduce(
      (sum, s) => sum + (s.stats?.totalQuantityDistributed || 0),
      0
    ),
    totalPending: shops.reduce(
      (sum, s) => sum + (s.stats?.pendingAmount || 0),
      0
    ),
    pendingDeliveries: shops.reduce(
      (sum, s) => sum + (s.stats?.pendingDeliveries || 0),
      0
    ),
  };

  const averageRevenuePerShop =
    shops.length > 0
      ? (networkMetrics.totalRevenue / shops.length).toFixed(2)
      : "0.00";

  // Prepare chart data
  const revenueByShop = shops
    .map((s) => ({
      name: s.shop.name.substring(0, 15),
      revenue: s.stats?.totalAmountDistributed || 0,
      distributions: s.stats?.totalDistributions || 0,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  const partnershipDistribution = shops.reduce((acc, s) => {
    const existing = acc.find((p) => p.name === s.partnershipType);
    if (existing) {
      existing.value++;
    } else {
      acc.push({ name: s.partnershipType, value: 1 });
    }
    return acc;
  }, [] as Array<{ name: string; value: number }>);

  const shopsWithIssues = shops.filter(
    (s) =>
      s.stats?.pendingDeliveries > 0 ||
      s.stats?.pendingAmount > 0 ||
      !s.isActive
  );

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Shops</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-brand-gradient">
              {totalShops}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {shops.filter((s) => s.isActive).length} active
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-brand-gradient">
              ₹{(networkMetrics.totalRevenue / 100000).toFixed(1)}L
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Avg: ₹{(parseFloat(averageRevenuePerShop) / 1000).toFixed(1)}K per
              shop
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Distributions</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-brand-gradient">
              {networkMetrics.totalDistributions}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {networkMetrics.totalQuantity.toLocaleString()} units
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <AlertCircle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              ₹{(networkMetrics.totalPending / 1000).toFixed(1)}K
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {networkMetrics.pendingDeliveries} deliveries
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Network Health Alert */}
      {shopsWithIssues.length > 0 && (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            {shopsWithIssues.length} shop{shopsWithIssues.length > 1 ? "s" : ""}{" "}
            require attention:
            {shopsWithIssues.map((s) => (
              <span key={s.id} className="ml-2">
                <Badge
                  variant="outline"
                  className="text-amber-700 border-amber-300"
                >
                  {s.shop.name}
                </Badge>
              </span>
            ))}
          </AlertDescription>
        </Alert>
      )}

      {/* Revenue Chart */}
      {revenueByShop.length > 0 && (
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-brand-gradient">
              Top Performing Shops
            </CardTitle>
            <Button
              size="sm"
              variant="outline"
              disabled={refreshing}
              onClick={async () => {
                setRefreshing(true);
                await loadNetworkData();
              }}
            >
              {refreshing ? "Loading..." : "Refresh"}
            </Button>
          </CardHeader>
          <CardContent>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueByShop}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis />
                  <Tooltip
                    formatter={(value) =>
                      `₹${((value as number) / 1000).toFixed(1)}K`
                    }
                    contentStyle={{
                      backgroundColor: "rgba(0, 0, 0, 0.8)",
                      border: "none",
                      borderRadius: "8px",
                      color: "#fff",
                    }}
                  />
                  <Legend />
                  <Bar dataKey="revenue" fill="#3b82f6" name="Revenue" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Partnership Type Distribution */}
      {partnershipDistribution.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-brand-gradient">
                Partnership Types
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={partnershipDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {partnershipDistribution.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Shops Table */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-brand-gradient">All Shops</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {shops.map((shop) => (
                  <div
                    key={shop.id}
                    className="p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">
                          {shop.shop.name}
                        </h4>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {shop.partnershipType}
                          </Badge>
                          {shop.isActive ? (
                            <Badge className="text-xs bg-green-100 text-green-800">
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">
                              Inactive
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-brand-gradient">
                          ₹
                          {(shop.stats?.totalAmountDistributed / 1000).toFixed(
                            1
                          )}
                          K
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {shop.stats?.totalDistributions} distributions
                        </div>
                      </div>
                    </div>
                    {(shop.stats?.pendingDeliveries > 0 ||
                      shop.stats?.pendingAmount > 0) && (
                      <div className="mt-2 pt-2 border-t text-xs text-amber-600">
                        ⚠️ Pending: ₹
                        {(shop.stats?.pendingAmount / 1000).toFixed(1)}K (
                        {shop.stats?.pendingDeliveries} deliveries)
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {shops.length === 0 && (
        <Card className="glass-card">
          <CardContent className="pt-6">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No connected shops yet. Start by discovering and connecting
                shops.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
