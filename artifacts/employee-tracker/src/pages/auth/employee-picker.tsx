import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { User, ShieldCheck, Loader2 } from "lucide-react";

interface PublicEmployee {
  id: number;
  fullName: string;
  position: string;
  role: string;
}

const COLORS = [
  "bg-black text-yellow-400",
  "bg-yellow-400 text-black",
  "bg-zinc-800 text-yellow-300",
  "bg-yellow-300 text-black",
  "bg-zinc-700 text-white",
  "bg-yellow-500 text-black",
];

export default function EmployeePickerPage() {
  const { quickLogin, isAuthenticated, user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [employees, setEmployees] = useState<PublicEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // If already logged in, redirect
  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      setLocation(user.role === 'admin' ? '/admin' : '/');
    }
  }, [isAuthenticated, authLoading, user]);

  useEffect(() => {
    fetch('/api/auth/employees-public')
      .then((r) => r.json())
      .then((data) => {
        setEmployees(data);
        setLoading(false);
      })
      .catch(() => {
        setError("No se pudo cargar la lista de empleados");
        setLoading(false);
      });
  }, []);

  const handleSelect = async (emp: PublicEmployee) => {
    if (selecting) return;
    setSelecting(emp.id);
    try {
      await quickLogin(emp.id);
    } catch (e) {
      setError("Error al iniciar sesión. Intente de nuevo.");
      setSelecting(null);
    }
  };

  const today = new Date();
  const dayNames = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
  const monthNames = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
  const dateLabel = `${dayNames[today.getDay()]}, ${today.getDate()} de ${monthNames[today.getMonth()]}`;

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Header */}
      <div className="bg-black text-white px-6 pt-10 pb-8">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-yellow-400 flex items-center justify-center">
              <span className="font-black text-black text-sm">TT</span>
            </div>
            <span className="font-black text-xl tracking-tight">TimeTracker</span>
          </div>
          <h1 className="text-3xl font-black leading-tight mb-1">¿Quién eres?</h1>
          <p className="text-white/50 text-sm font-medium">{dateLabel}</p>
        </div>
      </div>

      {/* Cards */}
      <div className="flex-1 px-6 py-8 max-w-lg mx-auto w-full">
        {loading ? (
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-36 bg-black/10 rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-destructive font-semibold">{error}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {employees.map((emp, idx) => {
              const colorClass = COLORS[idx % COLORS.length];
              const isSelecting = selecting === emp.id;
              const initials = emp.fullName
                .split(" ")
                .slice(0, 2)
                .map((n) => n[0])
                .join("")
                .toUpperCase();

              return (
                <motion.button
                  key={emp.id}
                  onClick={() => handleSelect(emp)}
                  disabled={!!selecting}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.08, duration: 0.35, ease: "easeOut" }}
                  className={`
                    relative overflow-hidden rounded-3xl p-5 text-left
                    flex flex-col justify-between min-h-[140px]
                    shadow-lg transition-all duration-150
                    ${colorClass}
                    ${selecting && !isSelecting ? "opacity-40" : ""}
                    ${!selecting ? "hover:scale-[1.02] hover:shadow-xl" : ""}
                  `}
                >
                  {/* Avatar circle */}
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center font-black text-lg mb-3">
                    {isSelecting ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      initials
                    )}
                  </div>

                  <div>
                    <p className="font-black text-base leading-tight">
                      {emp.fullName.split(" ")[0]}
                    </p>
                    <p className="font-black text-base leading-tight">
                      {emp.fullName.split(" ").slice(1).join(" ")}
                    </p>
                    <p className="text-xs mt-1 opacity-60 font-semibold truncate">{emp.position}</p>
                  </div>

                  {/* Decorative circle */}
                  <div className="absolute -bottom-6 -right-6 w-20 h-20 rounded-full bg-white/10" />
                </motion.button>
              );
            })}
          </div>
        )}

        {/* Admin Access */}
        <div className="mt-10 text-center">
          <button
            onClick={() => setLocation('/login')}
            className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-secondary transition-colors px-4 py-2 rounded-xl hover:bg-black/5"
          >
            <ShieldCheck className="w-4 h-4" />
            Acceso Administrador
          </button>
        </div>
      </div>
    </div>
  );
}
