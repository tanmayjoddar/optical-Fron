import { Link, useLocation } from "react-router";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard,
  Users,
  UserPlus,
  Package,
  ScanLine,
  FileText,
  Stethoscope,
  Activity,
  ShoppingCart,
  Plus,
  Receipt,
  BarChart,
  TrendingUp as TrendingUpIcon,
} from "lucide-react";

interface IconProps { className?: string }
interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<IconProps>;
  badge?: string;
  submenu?: NavigationItem[];
}

const navigation: NavigationItem[] = [
  {
    name: "Dashboard",
    href: "/staff-dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Patients",
    href: "/staff-dashboard/patients",
    icon: Users,
    submenu: [
      { name: "All Patients", href: "/staff-dashboard/patients", icon: Users },
      { name: "Add Patient", href: "/staff-dashboard/patients/create", icon: UserPlus },
    ],
  },
  {
    name: "Customers",
    href: "/staff-dashboard/customers",
    icon: ShoppingCart,
    submenu: [
      { name: "All Customers", href: "/staff-dashboard/customers", icon: Users },
      { name: "Add Customer", href: "/staff-dashboard/customers/create", icon: UserPlus },
    ],
  },
  {
    name: "Inventory",
    href: "/staff-dashboard/inventory",
    icon: Package,
    submenu: [
      { name: "Product Catalog", href: "/staff-dashboard/inventory", icon: Package },
      { name: "Add Product", href: "/staff-dashboard/inventory/products/create", icon: Plus },
  { name: "Stock Movements", href: "/staff-dashboard/inventory/stock-movements", icon: TrendingUpIcon },
    ],
  },
  {
    name: "Barcode Scanner",
    href: "/staff-dashboard/barcode",
    icon: ScanLine,
    badge: "New",
  },
  {
    name: "Invoices",
    href: "/staff-dashboard/invoices",
    icon: FileText,
    submenu: [
      { name: "All Invoices", href: "/staff-dashboard/invoices", icon: FileText },
      { name: "Create Invoice", href: "/staff-dashboard/invoices/create", icon: Plus },
    ],
  },
  {
    name: "Prescriptions",
    href: "/staff-dashboard/prescriptions",
    icon: Stethoscope,
    submenu: [
      { name: "All Prescriptions", href: "/staff-dashboard/prescriptions", icon: Stethoscope },
      { name: "Create Prescription", href: "/staff-dashboard/prescriptions/create", icon: Plus },
    ],
  },
  {
    name: "Reports",
    href: "/staff-dashboard/reports",
    icon: BarChart,
  },
  {
    name: "Stock Receipts",
    href: "/staff-dashboard/stock-receipts",
    icon: Receipt,
  },
];

interface StaffSidebarProps {
  mobile?: boolean;
  open?: boolean;
  onClose?: () => void;
}

const StaffSidebar = ({ mobile = false, open = false, onClose }: StaffSidebarProps) => {
  const location = useLocation();

  const isActive = (href: string) => {
    if (href === "/staff-dashboard") {
      return location.pathname === href;
    }
    return location.pathname.startsWith(href);
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo/Brand */}
      <div className="flex items-center px-6 py-4 border-b border-sidebar-border bg-sidebar">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-xl clay flex items-center justify-center">
            <Activity className="h-5 w-5 text-primary" />
          </div>
          <div className="ml-3">
            <h2 className="text-lg font-bold text-brand-gradient">OpticStaff</h2>
            <p className="text-xs text-muted-foreground">Staff Portal</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-2">
          {navigation.map((item) => (
            <div key={item.name}>
              <Link
                to={item.href}
                onClick={mobile ? onClose : undefined}
                className={cn(
                  "group flex items-center px-3 py-2 text-sm font-medium rounded-xl transition-colors clay",
                  isActive(item.href)
                    ? "ring-1 ring-primary/25"
                    : "hover:ring-1 hover:ring-primary/15"
                )}
              >
                <span className={cn("mr-3 h-5 w-5 flex-shrink-0", isActive(item.href) ? "text-primary" : "text-muted-foreground")}>
                  <item.icon className="h-5 w-5" />
                </span>
                <span className="flex-1">{item.name}</span>
                {item.badge && (
                  <Badge variant="secondary" className="ml-2 h-5 text-xs">
                    {item.badge}
                  </Badge>
                )}
              </Link>

              {/* Submenu */}
              {item.submenu && isActive(item.href) && (
                <div className="mt-1 ml-6 space-y-1">
                  {item.submenu.map((subItem) => (
                    <Link
                      key={subItem.name}
                      to={subItem.href}
                      onClick={mobile ? onClose : undefined}
                      className={cn(
                        "flex items-center px-3 py-1.5 text-sm rounded-lg transition-colors",
                        location.pathname === subItem.href
                          ? "bg-muted text-foreground"
                          : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                      )}
                    >
                      <subItem.icon className="mr-2 h-4 w-4" />
                      {subItem.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        <Separator className="my-4" />

        {/* Quick Stats */}
        <div className="px-3">
          <div className="glass-card rounded-lg p-4">
            <h3 className="text-sm font-medium mb-2">Quick Stats</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Today's Patients</span>
                <span className="font-medium">—</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Pending Orders</span>
                <span className="font-medium">—</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Low Stock Items</span>
                <span className="font-medium text-orange-600">—</span>
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );

  if (mobile) {
    return (
      <Sheet open={open} onOpenChange={onClose}>
        <SheetContent side="left" className="w-64 p-0 bg-sidebar">
          <SidebarContent />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <div className="flex flex-col w-full h-full bg-sidebar border-r border-sidebar-border">
      <SidebarContent />
    </div>
  );
};

export default StaffSidebar;