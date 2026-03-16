import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { MainLayout } from "@/components/layout/main-layout";
import { useGetMyBiweeklyReport } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Calendar, DollarSign, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function EmployeeHistory() {
  // Simplification: We would normally calculate the periods. Let's assume period format YYYY-MM-P1
  const today = new Date();
  const defaultPeriod = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${today.getDate() <= 15 ? 'P1' : 'P2'}`;
  
  const [period, setPeriod] = useState(defaultPeriod);
  
  const { data: report, isLoading } = useGetMyBiweeklyReport({ period });

  // Extremely basic period navigation for UI purposes
  const navigatePeriod = (dir: 'prev' | 'next') => {
    const [year, month, p] = period.split('-');
    let y = parseInt(year);
    let m = parseInt(month);
    let part = p;

    if (dir === 'prev') {
      if (part === 'P2') part = 'P1';
      else { part = 'P2'; m -= 1; if (m < 1) { m = 12; y -= 1; } }
    } else {
      if (part === 'P1') part = 'P2';
      else { part = 'P1'; m += 1; if (m > 12) { m = 1; y += 1; } }
    }
    setPeriod(`${y}-${String(m).padStart(2, '0')}-${part}`);
  };

  const periodLabel = period.endsWith('P1') ? '1ra Quincena' : '2da Quincena';
  const monthName = format(new Date(`${period.substring(0,7)}-02`), 'MMMM yyyy', { locale: es });

  return (
    <MainLayout title="Historial Quincenal" backTo="/">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Period Selector */}
        <div className="flex items-center justify-between bg-white p-2 rounded-2xl shadow-sm border border-border">
          <Button variant="ghost" size="icon" onClick={() => navigatePeriod('prev')} className="hover:bg-black/5">
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="text-center">
            <h3 className="font-display font-bold text-lg text-secondary capitalize">{monthName}</h3>
            <p className="text-sm text-primary font-bold">{periodLabel}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={() => navigatePeriod('next')} className="hover:bg-black/5">
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-6">
            <div className="h-32 bg-black/5 rounded-3xl animate-pulse" />
            <div className="h-64 bg-black/5 rounded-3xl animate-pulse" />
          </div>
        ) : report ? (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-6 md:p-8 rounded-3xl bg-secondary text-white shadow-xl shadow-black/10 flex items-center justify-between overflow-hidden relative">
                <div className="absolute right-0 top-0 w-32 h-32 bg-white/5 rounded-bl-full -mr-10 -mt-10" />
                <div className="z-10">
                  <p className="text-white/70 font-medium mb-1 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-primary" /> Pago Estimado
                  </p>
                  <h2 className="text-4xl md:text-5xl font-display font-bold text-primary">
                    ${report.totalEarnings?.toFixed(2) || '0.00'}
                  </h2>
                </div>
              </Card>

              <Card className="p-6 md:p-8 rounded-3xl bg-white border-2 border-border shadow-md flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground font-medium mb-1 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" /> Horas Trabajadas
                  </p>
                  <h2 className="text-4xl md:text-5xl font-display font-bold text-secondary">
                    {report.totalHours?.toFixed(1) || '0.0'} <span className="text-2xl text-muted-foreground">hrs</span>
                  </h2>
                  <p className="text-sm text-muted-foreground mt-2 font-medium bg-black/5 inline-block px-3 py-1 rounded-full">
                    Tarifa: ${report.hourlyRate}/hr
                  </p>
                </div>
              </Card>
            </div>

            {/* Daily Breakdown */}
            <div className="bg-white rounded-3xl shadow-sm border border-border overflow-hidden">
              <div className="p-6 border-b border-border bg-black/2 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center">
                  <Calendar className="w-5 h-5" />
                </div>
                <h3 className="font-display font-bold text-xl text-secondary">Desglose Diario</h3>
              </div>
              
              <div className="divide-y divide-border">
                {report.dailyBreakdown?.length > 0 ? (
                  report.dailyBreakdown.map((day, idx) => (
                    <div key={idx} className="p-4 sm:p-6 hover:bg-black/2 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="w-14 text-center">
                          <p className="text-sm font-bold text-muted-foreground uppercase">{format(new Date(day.date), 'EEE', { locale: es })}</p>
                          <p className="text-2xl font-display font-bold text-secondary">{format(new Date(day.date), 'dd')}</p>
                        </div>
                        <div className="space-y-1">
                          {day.records.map((r, i) => (
                            <div key={i} className="text-sm font-medium text-secondary bg-black/5 px-3 py-1.5 rounded-lg inline-block mr-2">
                              {format(new Date(r.checkInAt), 'HH:mm')} 
                              {r.checkOutAt ? ` - ${format(new Date(r.checkOutAt), 'HH:mm')}` : ' (Sin salida)'}
                            </div>
                          ))}
                          {day.records.length === 0 && (
                            <span className="text-sm text-muted-foreground italic">Sin registros</span>
                          )}
                        </div>
                      </div>
                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 border-border pt-3 sm:pt-0">
                        <p className="font-bold text-secondary">{day.totalHours.toFixed(1)} hrs</p>
                        <p className="text-primary font-bold bg-primary/10 px-2 py-0.5 rounded text-sm">${day.earnings.toFixed(2)}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-muted-foreground font-medium">
                    No hay registros en esta quincena.
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="p-12 text-center text-muted-foreground bg-white rounded-3xl border border-dashed border-border">
            No se pudo cargar el reporte.
          </div>
        )}
      </div>
    </MainLayout>
  );
}
