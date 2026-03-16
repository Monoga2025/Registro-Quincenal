import { useState, useEffect } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Link } from "wouter";
import { MainLayout } from "@/components/layout/main-layout";
import { HoldToRegister } from "@/components/hold-to-register";
import { useCheckIn, useGetTodayRecords } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Clock, Calendar, ArrowRight, History } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { getGetTodayRecordsQueryKey } from "@workspace/api-client-react";

export default function EmployeeHome() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentTime, setCurrentTime] = useState(new Date());

  const { data: records, isLoading: recordsLoading } = useGetTodayRecords();
  const checkInMutation = useCheckIn();

  // Clock tick
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
        description: error.message || "Es posible que ya tengas un registro abierto hoy.",
      });
    }
  };

  const formattedDate = format(currentTime, "EEEE, d 'de' MMMM", { locale: es });
  const capitalizedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto flex flex-col items-center gap-12 pt-8">
        
        {/* Date and Time Display */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-border shadow-sm mb-4">
            <Calendar className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-secondary">{capitalizedDate}</span>
          </div>
          <h2 className="text-6xl md:text-7xl font-display font-bold text-secondary tabular-nums tracking-tighter">
            {format(currentTime, "HH:mm")}
          </h2>
          <p className="text-muted-foreground font-medium text-lg flex items-center justify-center gap-2">
            <Clock className="w-5 h-5" /> 
            Hora Actual
          </p>
        </div>

        {/* Big Action Button */}
        <div className="my-8">
          <HoldToRegister 
            onRegister={handleRegister} 
            isProcessing={checkInMutation.isPending} 
            holdDuration={3000}
          />
        </div>

        {/* Today's Records List */}
        <div className="w-full space-y-4">
          <h3 className="font-display font-bold text-xl text-secondary flex items-center gap-2 border-b border-border pb-2">
            Entradas de Hoy
          </h3>
          
          <div className="space-y-3">
            {recordsLoading ? (
              <div className="h-24 bg-black/5 rounded-2xl animate-pulse" />
            ) : records && records.length > 0 ? (
              records.map((record) => (
                <Card key={record.id} className="p-4 md:p-5 flex items-center justify-between shadow-sm border-l-4 border-l-primary rounded-2xl bg-white hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                      <Clock className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-bold text-secondary text-lg">
                        {format(new Date(record.checkInAt), "HH:mm")}
                      </p>
                      <p className="text-sm text-muted-foreground font-medium">Entrada Registrada</p>
                    </div>
                  </div>
                  {record.checkOutAt && (
                    <div className="text-right">
                      <p className="font-bold text-secondary text-lg">
                        {format(new Date(record.checkOutAt), "HH:mm")}
                      </p>
                      <p className="text-sm text-muted-foreground font-medium">Salida</p>
                    </div>
                  )}
                </Card>
              ))
            ) : (
              <div className="text-center py-8 px-4 border-2 border-dashed border-border rounded-2xl bg-white/50">
                <p className="text-muted-foreground font-medium">Aún no has registrado entradas hoy.</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation to History */}
        <Link 
          href="/history" 
          className="w-full mt-4 flex items-center justify-between p-5 bg-secondary text-white rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
              <History className="w-6 h-6 text-primary" />
            </div>
            <div className="text-left">
              <h4 className="font-bold text-lg">Ver Historial Quincenal</h4>
              <p className="text-sm text-white/60">Consulta tus horas y pagos</p>
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
