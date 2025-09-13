import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  TrendingUp, 
  Activity, 
  BarChart3, 
  Package, 
  AlertTriangle, 
  Users, 
  UserCheck, 
  FileText,
  Calendar,
  ShoppingCart
} from "lucide-react";

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const navItems = [
  { 
    label: "Overview", 
    to: "/shop-admin-dashboard", 
    icon: LayoutDashboard,
    description: "Dashboard overview"
  },
  { 
    label: "Growth", 
    to: "/shop-admin-dashboard/growth", 
    icon: TrendingUp,
    description: "Growth analytics"
  },
  { 
    label: "Activities", 
    to: "/shop-admin-dashboard/activities", 
    icon: Activity,
    description: "Recent activities"
  },
  {
    category: "Reports",
    items: [
      { 
        label: "Sales Report", 
        to: "/shop-admin-dashboard/reports/sales", 
        icon: BarChart3,
        description: "Sales analytics"
      },
      { 
        label: "Product Sales", 
        to: "/shop-admin-dashboard/reports/products", 
        icon: ShoppingCart,
        description: "Product performance"
      },
      { 
        label: "Inventory", 
        to: "/shop-admin-dashboard/reports/inventory", 
        icon: Package,
        description: "Stock management"
      },
      { 
        label: "Low Stock Alerts", 
        to: "/shop-admin-dashboard/reports/low-stock", 
        icon: AlertTriangle,
        description: "Stock alerts",
        badge: "3"
      },
      { 
        label: "Patients", 
        to: "/shop-admin-dashboard/reports/patients", 
        icon: FileText,
        description: "Patient reports"
      },
      { 
        label: "Patient Visits", 
        to: "/shop-admin-dashboard/reports/patients/visits", 
        icon: Calendar,
        description: "Visit history"
      },
    ]
  },
  {
    category: "Staff Management",
    items: [
      { 
        label: "Staff List", 
        to: "/shop-admin-dashboard/staff", 
        icon: Users,
        description: "Manage staff"
      },
    ]
  }
];

function SidebarContent() {
  const location = useLocation();
  
  const isActiveLink = (to: string) => {
    return location.pathname === to;
  };

  const renderNavItem = (item: any) => {
    const Icon = item.icon;
    const isActive = isActiveLink(item.to);
    
    return (
      <Button
        key={item.to}
        variant={isActive ? "default" : "ghost"}
        className={`w-full justify-start gap-3 mb-1 h-12 ${
          isActive 
            ? "bg-primary text-primary-foreground shadow-sm" 
            : "hover:bg-accent hover:text-accent-foreground"
        }`}
        asChild
      >
        <Link to={item.to} className="flex items-center gap-3">
          <Icon className="h-4 w-4 flex-shrink-0" />
          <div className="flex-1 text-left">
            <div className="text-sm font-medium">{item.label}</div>
            <div className="text-xs text-muted-foreground">{item.description}</div>
          </div>
          {item.badge && (
            <Badge variant="destructive" className="ml-auto text-xs">
              {item.badge}
            </Badge>
          )}
        </Link>
      </Button>
    );
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-6">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
            <UserCheck className="h-4 w-4 text-white" />
          </div>
          <h2 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            OpticalShop
          </h2>
        </div>
      </div>
      
      <ScrollArea className="flex-1 px-4">
        <div className="space-y-6">
          {navItems.map((section, index) => {
            if ('items' in section && section.items) {
              return (
                <div key={index}>
                  <div className="px-3 py-2">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {section.category}
                    </h3>
                  </div>
                  <div className="space-y-1">
                    {section.items.map(renderNavItem)}
                  </div>
                  {index < navItems.length - 1 && <Separator className="my-4" />}
                </div>
              );
            } else {
              return renderNavItem(section);
            }
          })}
        </div>
      </ScrollArea>
    </div>
  );
}

export default function Sidebar({ sidebarOpen, setSidebarOpen }: SidebarProps) {
  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-80 md:flex-col md:fixed md:inset-y-0 z-50 bg-white border-r">
        <SidebarContent />
      </aside>
      
      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="p-0 w-80">
          <SidebarContent />
        </SheetContent>
      </Sheet>
    </>
  );
}
