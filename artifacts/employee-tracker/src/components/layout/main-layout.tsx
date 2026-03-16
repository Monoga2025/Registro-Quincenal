import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { LogOut, User, Menu, X, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function MainLayout({ children, title, backTo }: { children: ReactNode, title?: string, backTo?: string }) {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary selection:text-secondary">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-lg bg-white/80 border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            <div className="flex items-center gap-3">
              {backTo ? (
                <Link href={backTo} className="p-2 -ml-2 rounded-full hover:bg-black/5 transition-colors">
                  <ArrowLeft className="w-5 h-5 text-secondary" />
                </Link>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                    <span className="font-display font-bold text-secondary text-sm">ET</span>
                  </div>
                  <span className="font-display font-bold text-secondary hidden sm:block">TimeTracker</span>
                </div>
              )}
              {title && (
                <h1 className="font-display font-bold text-lg text-secondary ml-2 border-l-2 border-primary pl-3 hidden sm:block">
                  {title}
                </h1>
              )}
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-3 text-right">
                <div>
                  <p className="text-sm font-bold text-secondary leading-none">{user?.fullName}</p>
                  <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-secondary text-primary flex items-center justify-center font-bold">
                  {user?.fullName.charAt(0).toUpperCase()}
                </div>
              </div>
              
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={logout}
                className="hidden sm:flex text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                title="Cerrar sesión"
              >
                <LogOut className="w-5 h-5" />
              </Button>

              <button 
                className="sm:hidden p-2 text-secondary"
                onClick={() => setMenuOpen(!menuOpen)}
              >
                {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="sm:hidden fixed inset-0 z-30 pt-16 bg-white/95 backdrop-blur-xl animate-in fade-in slide-in-from-top-4">
          <div className="p-6 flex flex-col gap-6">
            <div className="flex items-center gap-4 pb-6 border-b border-border/50">
              <div className="w-14 h-14 rounded-full bg-secondary text-primary flex items-center justify-center font-bold text-xl">
                {user?.fullName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-lg font-bold text-secondary">{user?.fullName}</p>
                <p className="text-sm text-muted-foreground">{user?.position} • <span className="capitalize">{user?.role}</span></p>
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              {user?.role === 'admin' && (
                <Link href="/admin" className="px-4 py-3 rounded-xl font-medium text-secondary hover:bg-black/5" onClick={() => setMenuOpen(false)}>
                  Panel de Administración
                </Link>
              )}
              {user?.role === 'employee' && (
                <Link href="/" className="px-4 py-3 rounded-xl font-medium text-secondary hover:bg-black/5" onClick={() => setMenuOpen(false)}>
                  Inicio
                </Link>
              )}
              <button 
                onClick={() => { setMenuOpen(false); logout(); }}
                className="px-4 py-3 rounded-xl font-medium text-destructive flex items-center gap-2 hover:bg-destructive/10 text-left"
              >
                <LogOut className="w-5 h-5" /> Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both">
          {children}
        </div>
      </main>
    </div>
  );
}
