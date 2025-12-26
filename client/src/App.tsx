import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import NotFound from "@/pages/not-found";
import AdminOrdersPage from "@/pages/admin-orders";
import AdminInventoryPage from "@/pages/admin-inventory";
import { Menu, X, Loader2 } from "lucide-react";
import { useState } from "react";

function Header() {
  const { user, isLoading, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="border-b bg-background sticky top-0 z-50">
      <div className="px-4 py-3">
        {/* Desktop */}
        <div className="max-w-7xl mx-auto hidden md:flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1
              className="text-2xl font-bold cursor-pointer"
              onClick={() => setLocation("/orders")}
              data-testid="heading-app-title"
            >
              OrderFLOW Kitchen
            </h1>
            {user && (
              <nav className="flex gap-4">
                <Button
                  variant={location === "/orders" ? "default" : "ghost"}
                  onClick={() => setLocation("/orders")}
                  data-testid="button-nav-orders"
                >
                  Orders
                </Button>
                <Button
                  variant={location === "/inventory" ? "default" : "ghost"}
                  onClick={() => setLocation("/inventory")}
                  data-testid="button-nav-inventory"
                >
                  Inventory
                </Button>
              </nav>
            )}
          </div>
          <div>
            {isLoading ? (
              <div className="text-sm text-muted-foreground">Loading...</div>
            ) : user ? (
              <div className="flex items-center gap-4">
                <span className="text-sm" data-testid="text-user-email">
                  {user.email}
                </span>
                <Button
                  variant="outline"
                  onClick={() => logout()}
                  data-testid="button-logout"
                >
                  Logout
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => (window.location.href = "/api/login")}
                data-testid="button-login"
              >
                Admin Login
              </Button>
            )}
          </div>
        </div>

        {/* Mobile */}
        <div className="md:hidden">
          <div className="flex items-center justify-between">
            <h1
              className="text-xl font-bold cursor-pointer"
              onClick={() => {
                setLocation("/orders");
                setMobileMenuOpen(false);
              }}
              data-testid="heading-app-title"
            >
              OrderFLOW
            </h1>
            {user && (
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                data-testid="button-mobile-menu"
              >
                {mobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </Button>
            )}
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && user && (
            <nav className="mt-4 space-y-2 pb-4 border-t pt-4">
              <Button
                variant={location === "/orders" ? "default" : "ghost"}
                onClick={() => {
                  setLocation("/orders");
                  setMobileMenuOpen(false);
                }}
                className="w-full justify-start"
                data-testid="button-nav-orders-mobile"
              >
                Orders
              </Button>
              <Button
                variant={location === "/inventory" ? "default" : "ghost"}
                onClick={() => {
                  setLocation("/inventory");
                  setMobileMenuOpen(false);
                }}
                className="w-full justify-start"
                data-testid="button-nav-inventory-mobile"
              >
                Inventory
              </Button>
              <div className="border-t pt-4 space-y-2">
                <p className="text-xs text-muted-foreground px-2">{user.email}</p>
                <Button
                  variant="outline"
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full"
                  data-testid="button-logout-mobile"
                >
                  Logout
                </Button>
              </div>
            </nav>
          )}
        </div>
      </div>
    </header>
  );
}

function LoginPage() {
  const { login, isLoggingIn } = useAuth();
  const [username, setUsername] = useState("admin_orderflow");
  const [password, setPassword] = useState("admin");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        toast({
          variant: "destructive",
          title: "Login Failed",
          description: "Invalid username or password. Please try again.",
        });
        setIsLoading(false);
        return;
      }

      const data = await response.json();
      localStorage.setItem("auth_token", data.token);
      toast({
        title: "Success",
        description: "Logging in...",
      });
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: "Invalid username or password. Please try again.",
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex flex-col items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        {/* Logo/Header Section */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10">
            <div className="text-xl font-bold text-primary">O</div>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">OrderFLOW</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Kitchen Admin Dashboard</p>
        </div>

        {/* Login Card */}
        <div className="bg-card border border-border rounded-lg shadow-sm p-6 sm:p-8 space-y-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold text-foreground">Login</h2>
            <p className="text-sm text-muted-foreground mt-1">Sign in to manage your kitchen orders and inventory</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground block">Username</label>
              <Input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin_orderflow"
                className="w-full text-sm"
                data-testid="input-login-username"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground block">Password</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full text-sm"
                data-testid="input-login-password"
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full mt-8 text-base font-semibold gap-2"
              data-testid="button-login-submit"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isLoading ? "Logging in..." : "Login"}
            </Button>
          </form>

          {/* Demo Credentials Info */}
          <div className="bg-primary/5 border border-primary/10 rounded-lg p-4 mt-8">
            <p className="text-xs font-semibold text-foreground mb-3 uppercase tracking-wide">Demo Credentials</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Username:</span>
                <code className="text-xs font-mono bg-background px-2.5 py-1 rounded text-foreground">admin_orderflow</code>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Password:</span>
                <code className="text-xs font-mono bg-background px-2.5 py-1 rounded text-foreground">admin</code>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          This is a secure kitchen administration panel. Only authorized personnel should have access.
        </p>
      </div>
    </div>
  );
}

function Router() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="p-4">Loading...</div>;
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <Switch>
      <Route path="/orders" component={AdminOrdersPage} />
      <Route path="/inventory" component={AdminInventoryPage} />
      <Route path="/" component={AdminOrdersPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="flex flex-col min-h-screen">
          <Header />
          <main className="flex-1">
            <Router />
          </main>
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
