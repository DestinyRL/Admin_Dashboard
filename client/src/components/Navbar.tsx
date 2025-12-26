import { Link, useLocation } from "wouter";
import { ShoppingCart, LogIn, LogOut, Package, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import { Badge } from "@/components/ui/badge";

export function Navbar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { items } = useCart();
  
  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-display text-xl font-bold tracking-tight text-primary hover:opacity-90 transition-opacity">
            <Package className="h-6 w-6" />
            <span>OrderFlow</span>
          </Link>

          <div className="flex items-center gap-6">
            <Link href="/" className={`text-sm font-medium transition-colors hover:text-primary ${location === "/" ? "text-primary" : "text-muted-foreground"}`}>
              Store
            </Link>
            
            {user && (
              <Link href="/admin/dashboard" className={`text-sm font-medium transition-colors hover:text-primary ${location.startsWith("/admin") ? "text-primary" : "text-muted-foreground"}`}>
                Dashboard
              </Link>
            )}

            <div className="flex items-center gap-4">
              <Link href="/cart">
                <Button variant="ghost" size="icon" className="relative hover:bg-muted/50">
                  <ShoppingCart className="h-5 w-5" />
                  {cartCount > 0 && (
                    <Badge variant="default" className="absolute -right-1 -top-1 h-5 w-5 items-center justify-center rounded-full p-0 text-[10px]">
                      {cartCount}
                    </Badge>
                  )}
                </Button>
              </Link>

              {user ? (
                <div className="flex items-center gap-3 pl-4 border-l">
                  <div className="hidden md:flex flex-col items-end">
                    <span className="text-xs font-semibold">{user.firstName} {user.lastName}</span>
                    <span className="text-[10px] text-muted-foreground truncate max-w-[100px]">{user.email}</span>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => logout()}>
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button variant="default" size="sm" onClick={() => window.location.href = "/api/login"} className="gap-2">
                  <LogIn className="h-4 w-4" />
                  Login
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
