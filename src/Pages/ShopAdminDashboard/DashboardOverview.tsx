import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState, type ComponentType, type SVGProps } from "react";
import axios from "axios";
import { 
  DollarSign, 
  ShoppingCart, 
  Users, 
  UserCheck, 
  TrendingUp, 
  TrendingDown, 
  Package, 
  AlertTriangle,
  Calendar,
  Target
} from "lucide-react";

type Metrics = {
  today: {
    sales: number;
    orders: number;
    patients: number;
    staff: number;
  };
  monthly: {
    sales: number;
    orders: number;
    salesGrowth: number;
    orderGrowth: number;
  };
  inventory: {
    totalProducts: number;
    lowStockAlerts: number;
  };
};

function MetricCard({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  trend, 
  trendValue, 
  className = "" 
}: {
  title: string;
  value: string | number;
  description: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  trend?: "up" | "down" | "neutral";
  trendValue?: number;
  className?: string;
}) {
  const getTrendIcon = () => {
    if (trend === "up") return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (trend === "down") return <TrendingDown className="h-4 w-4 text-red-500" />;
    return null;
  };

  const getTrendColor = () => {
    if (trend === "up") return "text-green-600";
    if (trend === "down") return "text-red-600";
    return "text-muted-foreground";
  };

  return (
    <Card className={`hover:shadow-md transition-shadow glass-card ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center space-x-2 text-xs mt-1">
          <p className="text-muted-foreground">{description}</p>
          {trend && trendValue !== undefined && (
            <div className={`flex items-center space-x-1 ${getTrendColor()}`}>
              {getTrendIcon()}
              <span className="font-medium">{Math.abs(trendValue)}%</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function LoadingCards() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[...Array(8)].map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-16 mb-2" />
            <Skeleton className="h-3 w-24" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function DashboardOverview() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get("https://staff-production-c6d9.up.railway.app/shop-admin/dashboard/metrics", {
        headers: { 
        "Authorization": `Bearer ${localStorage.getItem("jwt")}`,
        "Content-Type": "application/json"
      }
    })
    .then(res => {
      setMetrics(res.data);
      setLoading(false);
    })
    .catch(err => {
      console.error("Error fetching metrics:", err);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
          <p className="text-muted-foreground">Welcome back! Here's what's happening today.</p>
        </div>
        <LoadingCards />
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold">Unable to load metrics</h3>
          <p className="text-muted-foreground">Please try refreshing the page</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
    <div className="flex items-center justify-between">
        <div>
      <h1 className="text-3xl font-bold tracking-tight text-brand-gradient">Dashboard Overview</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's what's happening today.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-xs">
            <Calendar className="h-3 w-3 mr-1" />
            Live Data
          </Badge>
        </div>
      </div>

      {/* Today's Metrics */}
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <Target className="h-5 w-5 mr-2" />
          Today's Performance
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Today's Sales"
            value={`₹${metrics.today.sales?.toLocaleString() || 0}`}
            description="Revenue generated today"
            icon={DollarSign}
            className="border-green-200 bg-green-50/50"
          />
          <MetricCard
            title="Orders"
            value={metrics.today.orders || 0}
            description="Orders processed today"
            icon={ShoppingCart}
            className="border-blue-200 bg-blue-50/50"
          />
          <MetricCard
            title="Patients"
            value={metrics.today.patients || 0}
            description="Patients served today"
            icon={Users}
            className="border-purple-200 bg-purple-50/50"
          />
          <MetricCard
            title="Active Staff"
            value={metrics.today.staff || 0}
            description="Staff members working"
            icon={UserCheck}
            className="border-orange-200 bg-orange-50/50"
          />
        </div>
      </div>

      {/* Monthly Metrics & Inventory */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Monthly Performance */}
  <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Monthly Performance
            </CardTitle>
            <CardDescription>Your business growth this month</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div>
                <p className="text-sm font-medium">Total Sales</p>
                <p className="text-2xl font-bold text-green-600">₹{metrics.monthly.sales?.toLocaleString()}</p>
              </div>
              <div className="text-right">
                <div className={`flex items-center space-x-1 ${
                  metrics.monthly.salesGrowth >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {metrics.monthly.salesGrowth >= 0 ? 
                    <TrendingUp className="h-4 w-4" /> : 
                    <TrendingDown className="h-4 w-4" />
                  }
                  <span className="font-medium">{Math.abs(metrics.monthly.salesGrowth)}%</span>
                </div>
                <p className="text-xs text-muted-foreground">vs last month</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div>
                <p className="text-sm font-medium">Total Orders</p>
                <p className="text-2xl font-bold text-blue-600">{metrics.monthly.orders}</p>
              </div>
              <div className="text-right">
                <div className={`flex items-center space-x-1 ${
                  metrics.monthly.orderGrowth >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {metrics.monthly.orderGrowth >= 0 ? 
                    <TrendingUp className="h-4 w-4" /> : 
                    <TrendingDown className="h-4 w-4" />
                  }
                  <span className="font-medium">{Math.abs(metrics.monthly.orderGrowth)}%</span>
                </div>
                <p className="text-xs text-muted-foreground">vs last month</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Inventory Status */}
  <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Package className="h-5 w-5 mr-2" />
              Inventory Status
            </CardTitle>
            <CardDescription>Current stock overview</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div>
                <p className="text-sm font-medium">Total Products</p>
                <p className="text-2xl font-bold">{metrics.inventory.totalProducts}</p>
              </div>
              <Package className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
              <div>
                <p className="text-sm font-medium text-red-800">Low Stock Alerts</p>
                <p className="text-2xl font-bold text-red-600">{metrics.inventory.lowStockAlerts}</p>
              </div>
              <div className="flex items-center">
                <AlertTriangle className="h-8 w-8 text-red-500" />
                {metrics.inventory.lowStockAlerts > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    Action Required
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
