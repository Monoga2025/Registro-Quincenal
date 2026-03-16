import { useState, useEffect } from "react";
import { useGetHourlyRate, useUpdateHourlyRate, getGetHourlyRateQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { DollarSign, Save } from "lucide-react";

export default function SettingsTab() {
  const { data: currentRate, isLoading } = useGetHourlyRate();
  const updateMutation = useUpdateHourlyRate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [rate, setRate] = useState<string>("");

  useEffect(() => {
    if (currentRate?.rate) {
      setRate(currentRate.rate.toString());
    }
  }, [currentRate]);

  const handleSave = async () => {
    const numRate = parseFloat(rate);
    if (isNaN(numRate) || numRate <= 0) {
      toast({ variant: "destructive", title: "Tarifa inválida", description: "Ingrese un número mayor a 0." });
      return;
    }

    try {
      await updateMutation.mutateAsync({ data: { rate: numRate } });
      queryClient.invalidateQueries({ queryKey: getGetHourlyRateQueryKey() });
      toast({ title: "Configuración guardada", description: "La tarifa por hora ha sido actualizada." });
    } catch (e) {
      toast({ variant: "destructive", title: "Error al guardar" });
    }
  };

  return (
    <div className="max-w-xl">
      <div className="mb-8">
        <h3 className="font-display font-bold text-2xl text-secondary">Configuración General</h3>
        <p className="text-muted-foreground">Administra los parámetros base del sistema de nómina.</p>
      </div>

      <div className="space-y-6 bg-black/2 p-6 md:p-8 rounded-3xl border border-border">
        
        <div>
          <label className="block text-sm font-bold text-secondary mb-2">Precio Base por Hora ($)</label>
          <p className="text-sm text-muted-foreground mb-4">
            Esta tarifa se aplicará por defecto al calcular la nómina de todos los empleados que no tengan una tarifa personalizada.
          </p>
          
          <div className="flex gap-4 items-start">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <DollarSign className="h-5 w-5 text-muted-foreground" />
              </div>
              <Input 
                type="number"
                step="0.01"
                min="0"
                className="pl-11 py-6 rounded-xl text-lg font-bold bg-white"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <Button 
              onClick={handleSave} 
              disabled={updateMutation.isPending || isLoading}
              className="py-6 px-8 rounded-xl font-bold bg-secondary text-primary hover:bg-black shadow-lg"
            >
              {updateMutation.isPending ? "Guardando..." : <><Save className="w-5 h-5 mr-2" /> Guardar</>}
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}
