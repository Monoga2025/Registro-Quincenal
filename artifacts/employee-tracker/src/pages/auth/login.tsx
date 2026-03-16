import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Fingerprint, Lock, User } from "lucide-react";
import { motion } from "framer-motion";

const loginSchema = z.object({
  username: z.string().min(1, "El usuario es requerido"),
  password: z.string().min(1, "La contraseña es requerida"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login } = useAuth();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema)
  });

  const onSubmit = async (data: LoginForm) => {
    setIsPending(true);
    setError(null);
    try {
      await login(data);
    } catch (e: any) {
      setError("Credenciales inválidas. Por favor intente de nuevo.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-background">
      {/* Background Image & Effects */}
      <div className="absolute inset-0 z-0">
        <img 
          src={`${import.meta.env.BASE_URL}images/auth-bg.png`} 
          alt="Abstract Background" 
          className="w-full h-full object-cover opacity-10 mix-blend-multiply"
        />
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/20 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-secondary/10 blur-[120px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md px-4 z-10"
      >
        <Card className="p-8 md:p-10 shadow-2xl shadow-black/10 border-white/50 backdrop-blur-xl bg-white/90 rounded-3xl">
          <div className="flex flex-col items-center mb-10">
            <div className="w-16 h-16 bg-secondary rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-secondary/20 relative">
              <div className="absolute inset-0 bg-primary rounded-2xl -rotate-6 -z-10" />
              <img 
                src={`${import.meta.env.BASE_URL}images/logo-mark.png`} 
                alt="Logo" 
                className="w-10 h-10 object-contain invert brightness-0 contrast-200"
              />
            </div>
            <h1 className="text-3xl font-display font-extrabold text-secondary tracking-tight">TimeTracker</h1>
            <p className="text-muted-foreground mt-2 font-medium">Gestión de Control y Nómina</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {error && (
              <div className="p-3 rounded-xl bg-destructive/10 text-destructive text-sm font-semibold flex items-center gap-2">
                <Fingerprint className="w-4 h-4" /> {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-bold text-secondary ml-1">Usuario</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-muted-foreground" />
                </div>
                <Input
                  {...register("username")}
                  className="pl-11 py-6 bg-white border-2 border-border focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-xl text-base shadow-sm"
                  placeholder="Ej: jdoe"
                />
              </div>
              {errors.username && <p className="text-destructive text-sm mt-1 ml-1">{errors.username.message}</p>}
            </div>

            <div className="space-y-1.5 pb-2">
              <label className="text-sm font-bold text-secondary ml-1">Contraseña</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-muted-foreground" />
                </div>
                <Input
                  type="password"
                  {...register("password")}
                  className="pl-11 py-6 bg-white border-2 border-border focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-xl text-base shadow-sm"
                  placeholder="••••••••"
                />
              </div>
              {errors.password && <p className="text-destructive text-sm mt-1 ml-1">{errors.password.message}</p>}
            </div>

            <Button
              type="submit"
              disabled={isPending}
              className="w-full py-6 text-lg font-bold bg-secondary hover:bg-black text-primary rounded-xl shadow-lg shadow-black/20 hover:-translate-y-0.5 transition-all duration-200"
            >
              {isPending ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  Iniciando...
                </div>
              ) : (
                "Ingresar al Sistema"
              )}
            </Button>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}
