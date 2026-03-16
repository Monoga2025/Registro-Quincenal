import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useLocation } from "wouter";
import { useGetMe, useLogin, useLogout, type User, type LoginRequest } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

interface AuthContextType {
  user: User | null | undefined;
  isLoading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [token, setToken] = useState<string | null>(localStorage.getItem('auth_token'));

  const { data: user, isLoading: isUserLoading, refetch, isError } = useGetMe({
    query: {
      enabled: !!token,
      retry: false
    }
  });

  const loginMutation = useLogin();
  const logoutMutation = useLogout();

  useEffect(() => {
    const handleUnauthorized = () => {
      setToken(null);
      setLocation('/login');
    };
    window.addEventListener('auth_unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth_unauthorized', handleUnauthorized);
  }, [setLocation]);

  useEffect(() => {
    if (isError) {
      localStorage.removeItem('auth_token');
      setToken(null);
    }
  }, [isError]);

  const handleLogin = async (data: LoginRequest) => {
    try {
      const res = await loginMutation.mutateAsync({ data });
      localStorage.setItem('auth_token', res.token);
      setToken(res.token);
      await refetch();
      
      toast({
        title: "¡Bienvenido!",
        description: `Hola ${res.user.fullName}`,
      });
      
      if (res.user.role === 'admin') {
        setLocation('/admin');
      } else {
        setLocation('/');
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error de inicio de sesión",
        description: "Usuario o contraseña incorrectos",
      });
      throw error;
    }
  };

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch (e) {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem('auth_token');
      setToken(null);
      setLocation('/login');
    }
  };

  const isLoading = isUserLoading && !!token;

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        isLoading, 
        login: handleLogin, 
        logout: handleLogout,
        isAuthenticated: !!user 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
