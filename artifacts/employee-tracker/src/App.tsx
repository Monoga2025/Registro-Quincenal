import { useEffect } from "react";
import { Switch, Route, Router as WouterRouter, useLocation, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { setupFetchInterceptor } from "@/lib/api-setup";

import EmployeePickerPage from "@/pages/auth/employee-picker";
import LoginPage from "@/pages/auth/login";
import EmployeeHome from "@/pages/employee/home";
import EmployeeHistory from "@/pages/employee/history";
import AdminDashboard from "@/pages/admin/dashboard";

setupFetchInterceptor();

const queryClient = new QueryClient();

function ProtectedEmployee({ component: Component }: { component: any }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) setLocation('/');
      else if (user?.role === 'admin') setLocation('/admin');
    }
  }, [isLoading, isAuthenticated, user, setLocation]);

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
    </div>
  );

  if (!isAuthenticated || user?.role !== 'employee') return null;
  return <Component />;
}

function ProtectedAdmin({ component: Component }: { component: any }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) setLocation('/');
      else if (user?.role !== 'admin') setLocation('/home');
    }
  }, [isLoading, isAuthenticated, user, setLocation]);

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
    </div>
  );

  if (!isAuthenticated || user?.role !== 'admin') return null;
  return <Component />;
}

function HomeRoute() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      setLocation(user?.role === 'admin' ? '/admin' : '/home');
    }
  }, [isLoading, isAuthenticated, user, setLocation]);

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
    </div>
  );

  if (isAuthenticated) return null;

  return <EmployeePickerPage />;
}

function Router() {
  return (
    <Switch>
      {/* "/" = employee picker for guests, redirect to home if logged in */}
      <Route path="/" component={HomeRoute} />

      {/* Admin password login */}
      <Route path="/login" component={LoginPage} />

      {/* Employee routes */}
      <Route path="/home">
        {() => <ProtectedEmployee component={EmployeeHome} />}
      </Route>
      <Route path="/history">
        {() => <ProtectedEmployee component={EmployeeHistory} />}
      </Route>

      {/* Admin routes */}
      <Route path="/admin">
        {() => <ProtectedAdmin component={AdminDashboard} />}
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
