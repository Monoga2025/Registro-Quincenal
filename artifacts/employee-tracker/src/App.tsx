import { useEffect } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { setupFetchInterceptor } from "@/lib/api-setup";

// Pages
import EmployeePickerPage from "@/pages/auth/employee-picker";
import LoginPage from "@/pages/auth/login";
import EmployeeHome from "@/pages/employee/home";
import EmployeeHistory from "@/pages/employee/history";
import AdminDashboard from "@/pages/admin/dashboard";

setupFetchInterceptor();

const queryClient = new QueryClient();

function ProtectedRoute({ component: Component, allowedRoles }: { component: any; allowedRoles?: string[] }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation('/select');
    }
  }, [isLoading, isAuthenticated, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    setLocation(user.role === 'admin' ? '/admin' : '/');
    return null;
  }

  return <Component />;
}

function Router() {
  const { isAuthenticated, user } = useAuth();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (location === '/' && isAuthenticated && user?.role === 'admin') {
      setLocation('/admin');
    }
  }, [location, isAuthenticated, user, setLocation]);

  return (
    <Switch>
      {/* Public: employee picker (default entry) */}
      <Route path="/select" component={EmployeePickerPage} />

      {/* Admin password login */}
      <Route path="/login" component={LoginPage} />

      {/* Employee routes */}
      <Route path="/">
        {() => <ProtectedRoute component={EmployeeHome} allowedRoles={['employee']} />}
      </Route>
      <Route path="/history">
        {() => <ProtectedRoute component={EmployeeHistory} allowedRoles={['employee']} />}
      </Route>

      {/* Admin routes */}
      <Route path="/admin">
        {() => <ProtectedRoute component={AdminDashboard} allowedRoles={['admin']} />}
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <Router />
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
