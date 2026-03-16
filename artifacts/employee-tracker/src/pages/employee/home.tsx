import { useState, useEffect } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Link } from "wouter";
import { MainLayout } from "@/components/layout/main-layout";
import { HoldToRegister } from "@/components/hold-to-register";
import { useCheckIn, useGetTodayRecords } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Clock, Calendar, ArrowRight, History, LogIn, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { getGetTodayRecordsQueryKey } from "@workspace/api-client-react";

function formatMinutes(decimalHours: number): string {
  const totalMinutes = Math.round(decimalHours * 60);
  if (totalMinutes < 60) return `${totalMinutes} min`;
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

export default function EmployeeHome() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentTime, setCurrentTime] = useState(new Date());

  const { data: records, isLoading: recordsLoading } = useGetTodayRecords();
  const checkInMutation = useCheckIn();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleRegister = async () => {
    try {
      await checkInMutation.mutateAsync();
      await queryClient.invalidateQueries({ queryKey: getGetTodayRecordsQueryKey() });
      toast({
        title: "Registro exitoso",
        description: `Hora registrada: ${format(new Date(), "HH:mm:ss")}`,
        className: "bg-green-50 border-green-200 text-green-900",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "No se pudo registrar",
        description: error.message || "Intente de nuevo.",
      });
    }
  };

  const formattedDate = format(currentTime, "EEEE, d 'de' MMMM", { locale: es });
  const capitalizedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

  // Total minutes worked today
  const totalMinutesToday = (records ?? []).reduce((sum, r) => {
    if (r.hoursWorked) return sum + Math.round(r.hoursWorked * 60);
    return sum;
  }, 0);

  const hasOpenRecord = (records ?? []).some((r) => !r.checkOutAt);

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto flex flex-col items-center gap-10 pt-6">

        {/* Date and Time Display */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-border shadow-sm mb-3">
            <Calendar className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-secondary">{capitalizedDate}</span>
          </div>
          <h2 className="text-6xl md:text-7xl font-display font-bold text-secondary tabular-nums tracking-tighter">
            {format(currentTime, "HH:mm")}
            <span className="text-3xl text-muted-foreground">:{format(currentTime, "ss")}</span>
          </h2>
          {totalMinutesToday > 0 && (
            <p className="text-sm font-bold text-primary bg-primary/10 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full">
              <Clock className="w-3.5 h-3.5" />
              {formatMinutes(totalMinutesToday / 60)} trabajados hoy
            </p>
          )}
        </div>

        {/* Status hint */}
        <div className="text-center -mb-4">
          <p className="text-sm font-semibold text-muted-foreground">
            {hasOpenRecord
              ? "⏱ Sesión abierta — mantén para registrar salida"
              : "Mantén presionado 3 segundos para registrar"}
          </p>
        </div>

        {/* Big Action Button */}
        <div className="my-4">
          <HoldToRegister
            onRegister={handleRegister}
            isProcessing={checkInMutation.isPending}
            holdDuration={3000}
            hasOpenRecord={hasOpenRecord}
          />
        </div>

        {/* Today's Records List */}
        <div className="w-full space-y-3">
          <h3 className="font-display font-bold text-xl text-secondary flex items-center gap-2 border-b border-border pb-2">
            Registros de Hoy
          </h3>

          <div className="space-y-3">
            {recordsLoading ? (
              <div className="h-24 bg-black/5 rounded-2xl animate-pulse" />
            ) : records && records.length > 0 ? (
              records.map((record) => (
                <Card
                  key={record.id}
                  className={`p-4 flex items-center justify-between shadow-sm rounded-2xl bg-white
                    ${!record.checkOutAt ? 'border-l-4 border-l-yellow-400' : 'border-l-4 border-l-green-400'}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center
                      ${!record.checkOutAt ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                      {!record.checkOutAt ? <LogIn className="w-5 h-5" /> : <LogOut className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="font-bold text-secondary text-lg tabular-nums">
                        {format(new Date(record.checkInAt), "HH:mm")}
                        {record.checkOutAt && (
                          <span className="text-muted-foreground font-medium"> → {format(new Date(record.checkOutAt), "HH:mm")}</span>
                        )}
                      </p>
                      <p className="text-sm text-muted-foreground font-medium">
                        {!record.checkOutAt ? "En curso" : "Completado"}
                      </p>
                    </div>
                  </div>
                  {record.hoursWorked ? (
                    <div className="text-right">
                      <span className="font-bold text-secondary bg-black/5 px-3 py-1 rounded-xl text-sm">
                        {formatMinutes(record.hoursWorked)}
                      </span>
                    </div>
                  ) : !record.checkOutAt ? (
                    <span className="text-xs font-bold text-yellow-600 bg-yellow-100 px-2 py-1 rounded-lg animate-pulse">
                      Activo
                    </span>
                  ) : null}
                </Card>
              ))
            ) : (
              <div className="text-center py-8 px-4 border-2 border-dashed border-border rounded-2xl bg-white/50">
                <p className="text-muted-foreground font-medium">Aún no has registrado entradas hoy.</p>
                <p className="text-sm text-muted-foreground mt-1">Mantén el botón presionado para comenzar.</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation to History */}
        <Link
          href="/history"
          className="w-full flex items-center justify-between p-5 bg-secondary text-white rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
              <History className="w-6 h-6 text-primary" />
            </div>
            <div className="text-left">
              <h4 className="font-bold text-lg">Ver Historial Quincenal</h4>
              <p className="text-sm text-white/60">Consulta tus minutos y pagos</p>
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-primary text-secondary flex items-center justify-center group-hover:bg-white transition-colors">
            <ArrowRight className="w-5 h-5" />
          </div>
        </Link>

      </div>
    </MainLayout>
  );
}
