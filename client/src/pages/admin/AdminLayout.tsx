import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Truck, 
  LogOut,
  Store
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface AdminLayoutProps {
  children: ReactNode;
  title: string;
}

export function AdminLayout({ children, title }: AdminLayoutProps) {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const navItems = [
    { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
    { href: "/admin/products", label: "Inventory", icon: Package },
    { href: "/admin/delivery", label: "Delivery", icon: Truck },
  ];

  if (!user) {
    // Auth guard handled by redirect in App or hook, but safe return here
    return null;
  }

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-card border-r flex flex-col h-auto md:min-h-screen sticky top-0">
        <div className="p-6 border-b">
          <Link href="/admin/dashboard" className="flex items-center gap-2 font-display text-xl font-bold tracking-tight text-primary">
            <Package className="h-6 w-6" />
            <span>Admin Panel</span>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            
            return (
              <Link key={item.href} href={item.href}>
                <Button 
                  variant={isActive ? "secondary" : "ghost"} 
                  className={cn(
                    "w-full justify-start gap-3 mb-1",
                    isActive && "bg-primary/10 text-primary hover:bg-primary/15"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Button>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t space-y-2">
          <Link href="/">
            <Button variant="outline" className="w-full justify-start gap-3">
              <Store className="h-4 w-4" />
              View Store
            </Button>
          </Link>
          <Button variant="ghost" className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => logout()}>
            <LogOut className="h-4 w-4" />
            Log Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <header className="mb-8 flex justify-between items-center">
          <h1 className="font-display text-3xl font-bold">{title}</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
             <span>Welcome back, {user.firstName}</span>
             <div className="h-8 w-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold">
               {user.firstName?.[0]}{user.lastName?.[0]}
             </div>
          </div>
        </header>

        <div className="animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
}
