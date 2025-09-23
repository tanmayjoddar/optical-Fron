import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Users, Package, FileText } from "lucide-react";

const DashboardOverview = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-gradient">Dashboard Overview</h1>
        <p className="text-muted-foreground">Welcome to your staff dashboard</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
  <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">—</div>
            <p className="text-xs text-muted-foreground">&nbsp;</p>
          </CardContent>
        </Card>

  <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inventory Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">—</div>
            <p className="text-xs text-muted-foreground">&nbsp;</p>
          </CardContent>
        </Card>

  <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Invoices</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">—</div>
            <p className="text-xs text-muted-foreground">&nbsp;</p>
          </CardContent>
        </Card>

  <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">—</div>
            <p className="text-xs text-muted-foreground">&nbsp;</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-brand-gradient">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <button className="p-4 rounded-lg clay hover:ring-1 hover:ring-primary/20 transition-all">
              <Users className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <p className="text-sm font-medium">Add Patient</p>
            </button>
            <button className="p-4 rounded-lg clay hover:ring-1 hover:ring-primary/20 transition-all">
              <Package className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <p className="text-sm font-medium">Scan Barcode</p>
            </button>
            <button className="p-4 rounded-lg clay hover:ring-1 hover:ring-primary/20 transition-all">
              <FileText className="h-8 w-8 mx-auto mb-2 text-purple-600" />
              <p className="text-sm font-medium">Create Invoice</p>
            </button>
            <button className="p-4 rounded-lg clay hover:ring-1 hover:ring-primary/20 transition-all">
              <Activity className="h-8 w-8 mx-auto mb-2 text-orange-600" />
              <p className="text-sm font-medium">Stock Movement</p>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardOverview;