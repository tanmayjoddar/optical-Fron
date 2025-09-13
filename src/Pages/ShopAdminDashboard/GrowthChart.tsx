import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState } from "react";
import axios from "axios";
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  DollarSign, 
  ShoppingCart, 
  Users,
  Calendar,
  RefreshCcw
} from "lucide-react";

type GrowthData = {
  period: string;
  sales: number;
  orders: number;
  patients: number;
};

function GrowthMetricCard({ 
  title, 
  current, 
  previous, 
  icon: Icon, 
  formatter 
}: {
  title: string;
  current: number;
  previous: number;
  icon: any;
  formatter?: (value: number) => string;
}) {
  const growth = previous > 0 ? ((current - previous) / previous) * 100 : 0;
  const isPositive = growth >= 0;
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {formatter ? formatter(current) : current.toLocaleString()}
        </div>
        <div className="flex items-center space-x-2 text-xs">
          <div className={`flex items-center space-x-1 ${
            isPositive ? 'text-green-600' : 'text-red-600'
          }`}>
            {isPositive ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            <span className="font-medium">{Math.abs(growth).toFixed(1)}%</span>
          </div>
          <span className="text-muted-foreground">vs previous period</span>
        </div>
      </CardContent>
    </Card>
  );
}

function GrowthBarChart({ data, period }: { data: GrowthData[]; period: string }) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-muted/30 rounded-lg">
        <div className="text-center">
          <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No data available for {period} view</p>
        </div>
      </div>
    );
  }

  const maxSales = Math.max(...data.map(d => d.sales)) || 1;
  const maxOrders = Math.max(...data.map(d => d.orders)) || 1;
  const maxPatients = Math.max(...data.map(d => d.patients)) || 1;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-1 mb-2">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span className="text-sm font-medium">Sales</span>
          </div>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center space-x-1 mb-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span className="text-sm font-medium">Orders</span>
          </div>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center space-x-1 mb-2">
            <div className="w-3 h-3 bg-purple-500 rounded"></div>
            <span className="text-sm font-medium">Patients</span>
          </div>
        </div>
      </div>
      
      <div className="space-y-4">
        {data.map((item, idx) => (
          <div key={idx} className="p-4 border rounded-lg hover:bg-muted/30 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium">{item.period}</h4>
              <Badge variant="outline" className="text-xs">
                Period {idx + 1}
              </Badge>
            </div>
            
            {/* Sales Bar */}
            <div className="mb-3">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-muted-foreground">Sales</span>
                <span className="font-medium">₹{item.sales.toLocaleString()}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-500" 
                  style={{ width: `${(item.sales / maxSales) * 100}%` }}
                ></div>
              </div>
            </div>
            
            {/* Orders Bar */}
            <div className="mb-3">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-muted-foreground">Orders</span>
                <span className="font-medium">{item.orders}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-500" 
                  style={{ width: `${(item.orders / maxOrders) * 100}%` }}
                ></div>
              </div>
            </div>
            
            {/* Patients Bar */}
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-muted-foreground">Patients</span>
                <span className="font-medium">{item.patients}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-purple-500 h-2 rounded-full transition-all duration-500" 
                  style={{ width: `${(item.patients / maxPatients) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-20 mb-2" />
              <Skeleton className="h-4 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function GrowthChart() {
  const [data, setData] = useState<GrowthData[]>([]);
  const [period, setPeriod] = useState("monthly");
  const [loading, setLoading] = useState(true);

  const fetchData = async (selectedPeriod: string) => {
    setLoading(true);
    try {
      const response = await axios.get(
        `https://staff-optical-production.up.railway.app/shop-admin/dashboard/growth?period=${selectedPeriod}`,
        {
          headers: {
            "Authorization": `Bearer ${localStorage.getItem("jwt")}`,
            "Content-Type": "application/json"
          }
        }
      );
      setData(response.data);
    } catch (error) {
      console.error("Error fetching growth data:", error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(period);
  }, [period]);

  const handleRefresh = () => {
    fetchData(period);
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  // Calculate metrics for comparison
  const currentPeriodData = data[data.length - 1];
  const previousPeriodData = data[data.length - 2];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center">
            <TrendingUp className="h-8 w-8 mr-3 text-blue-600" />
            Growth Analytics
          </h1>
          <p className="text-muted-foreground">
            Track your business performance over time
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCcw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Badge variant="secondary" className="text-xs">
            <Calendar className="h-3 w-3 mr-1" />
            {period.charAt(0).toUpperCase() + period.slice(1)} View
          </Badge>
        </div>
      </div>

      {/* Growth Metrics */}
      {currentPeriodData && previousPeriodData && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Period Comparison</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <GrowthMetricCard
              title="Sales Growth"
              current={currentPeriodData.sales}
              previous={previousPeriodData.sales}
              icon={DollarSign}
              formatter={(value) => `₹${value.toLocaleString()}`}
            />
            <GrowthMetricCard
              title="Orders Growth"
              current={currentPeriodData.orders}
              previous={previousPeriodData.orders}
              icon={ShoppingCart}
            />
            <GrowthMetricCard
              title="Patients Growth"
              current={currentPeriodData.patients}
              previous={previousPeriodData.patients}
              icon={Users}
            />
          </div>
        </div>
      )}

      {/* Growth Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Growth Data
              </CardTitle>
              <CardDescription>
                {period.charAt(0).toUpperCase() + period.slice(1)} performance breakdown
              </CardDescription>
            </div>
            <Tabs value={period} onValueChange={setPeriod}>
              <TabsList>
                <TabsTrigger value="daily">Daily</TabsTrigger>
                <TabsTrigger value="monthly">Monthly</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          <GrowthBarChart data={data} period={period} />
        </CardContent>
      </Card>
    </div>
  );
}
