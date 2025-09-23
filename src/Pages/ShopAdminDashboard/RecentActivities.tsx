import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useEffect, useState } from "react";
import axios from "axios";
import Pagination from "./Pagination/Pagination";
import { 
  Activity as ActivityIcon, 
  DollarSign, 
  ShoppingCart, 
  Users, 
  Package, 
  AlertTriangle,
  Clock,
  TrendingUp,
  Eye,
  RefreshCcw,
  Filter
} from "lucide-react";

type Activity = {
  type: string;
  message: string;
  amount?: number;
  timestamp: string;
};

function getActivityIcon(type: string) {
  switch (type.toLowerCase()) {
    case 'sale':
    case 'sales':
      return DollarSign;
    case 'order':
    case 'orders':
      return ShoppingCart;
    case 'patient':
    case 'patients':
      return Users;
    case 'inventory':
    case 'stock':
      return Package;
    case 'alert':
    case 'warning':
      return AlertTriangle;
    default:
      return ActivityIcon;
  }
}

function getActivityColor(type: string) {
  switch (type.toLowerCase()) {
    case 'sale':
    case 'sales':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'order':
    case 'orders':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'patient':
    case 'patients':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'inventory':
    case 'stock':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'alert':
    case 'warning':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

function ActivityItem({ activity }: { activity: Activity }) {
  const Icon = getActivityIcon(activity.type);
  const colorClass = getActivityColor(activity.type);
  const timeAgo = new Date(activity.timestamp).toLocaleString();
  
  return (
    <div className="relative flex items-start space-x-4 pb-6">
      {/* Timeline line */}
      <div className="absolute left-6 top-12 h-full w-px bg-border"></div>
      
      {/* Activity icon */}
      <div className={`relative z-10 flex h-12 w-12 items-center justify-center rounded-full border-2 ${colorClass}`}>
        <Icon className="h-5 w-5" />
      </div>
      
      {/* Activity content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="text-xs">
              {activity.type}
            </Badge>
            <span className="text-xs text-muted-foreground flex items-center">
              <Clock className="h-3 w-3 mr-1" />
              {timeAgo}
            </span>
          </div>
          {activity.amount && (
            <div className="flex items-center text-green-600 font-medium">
              <DollarSign className="h-4 w-4 mr-1" />
              ₹{activity.amount.toLocaleString()}
            </div>
          )}
        </div>
        <p className="mt-1 text-sm text-foreground">{activity.message}</p>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-start space-x-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-5 w-20" />
            </div>
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function RecentActivities() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
  "https://staff-production-c6d9.up.railway.app/shop-admin/dashboard/activities",
        {
          headers: {
            "Authorization": `Bearer ${localStorage.getItem("jwt")}`,
            "Content-Type": "application/json"
          }
        }
      );
      setActivities(response.data);
    } catch (error) {
      console.error("Error fetching activities:", error);
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  const handleRefresh = () => {
    fetchActivities();
  };

  const paginated = activities.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.ceil(activities.length / pageSize);

  // Activity stats
  const activityStats = activities.reduce((acc, activity) => {
    acc[activity.type] = (acc[activity.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalAmount = activities
    .filter(a => a.amount)
    .reduce((sum, a) => sum + (a.amount || 0), 0);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Recent Activities</h1>
          <p className="text-muted-foreground">Latest business activities and transactions</p>
        </div>
        <div className="grid gap-6 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-12" />
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
            <LoadingSkeleton />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center">
            <ActivityIcon className="h-8 w-8 mr-3 text-blue-600" />
            Recent Activities
          </h1>
          <p className="text-muted-foreground">
            Latest business activities and transactions
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
            {activities.length} Activities
          </Badge>
        </div>
      </div>

      {/* Activity Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Activities</CardTitle>
            <ActivityIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activities.length}</div>
            <p className="text-xs text-muted-foreground">All recorded activities</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">₹{totalAmount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">From valued activities</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Most Common</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.keys(activityStats).length > 0 
                ? Object.keys(activityStats).reduce((a, b) => activityStats[a] > activityStats[b] ? a : b)
                : 'N/A'
              }
            </div>
            <p className="text-xs text-muted-foreground">Activity type</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <Filter className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.keys(activityStats).length}</div>
            <p className="text-xs text-muted-foreground">Unique types</p>
          </CardContent>
        </Card>
      </div>

      {/* Activities Timeline */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Activity Timeline
              </CardTitle>
              <CardDescription>
                Chronological view of recent business activities
              </CardDescription>
            </div>
            <Button variant="outline" size="sm">
              <Eye className="h-4 w-4 mr-2" />
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {activities.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-center">
                <ActivityIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No activities found</p>
              </div>
            </div>
          ) : (
            <ScrollArea className="h-96">
              <div className="space-y-0">
                {paginated.map((activity, idx) => (
                  <div key={idx}>
                    <ActivityItem activity={activity} />
                    {idx < paginated.length - 1 && <Separator className="my-4" />}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
          
          {totalPages > 1 && (
            <div className="mt-6">
              <Pagination 
                page={page} 
                totalPages={totalPages} 
                onPageChange={setPage} 
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
