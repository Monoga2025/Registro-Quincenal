import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { MainLayout } from "@/components/layout/main-layout";
import { useGetMyBiweeklyReport } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Calendar, DollarSign, Clock, ChevronLeft, ChevronRight, LogIn, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

function formatMinutes(decimalHours: number): string {
  const totalMinutes = Math.round(decimalHours * 60);
  if (totalMinutes === 0) return "0 min";
  if (totalMinutes < 60) return `${totalMinutes} min`;
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

export default function EmployeeHistory() {
  const today = new Date();
  const defaultPeriod = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${today.getDate() <= 15 ? 'P1' : 'P2'}`;

  const [period, setPeriod] = useState(defaultPeriod);

  const { data: report, isLoading } = useGetMyBiweeklyReport({ period });

  const navigatePeriod = (dir: 'prev' | 'next') => {
    const parts = period.split('-');
    let y = parseInt(parts[0]);
    let m = parseInt(parts[1]);
    let p = parts[2];

    if (dir === 'prev') {
      if (p === 'P2') p = 'P1';
      else { p = 'P2'; m -= 1; if (m < 1) { m = 12; y -= 1; } }
    } else {
      if (p === 'P1') p = 'P2';
      else { p = 'P1'; m += 1; if (m > 12) { m = 1; y += 1; } }
    }
    setPeriod(`${y}-${String(m).padStart(2, '0')}-${p}`);
  };

  const periodLabel = period.endsWith('P1') ? '1ra Quincena' : '2da Quincena';
  const monthName = format(new Date(`${period.substring(0, 7)}-02`), 'MMMM yyyy', { locale: es });

  // Calculate total minutes
  const totalMinutes = report ? Math.round((report.totalHours ?? 0) * 60) : 0;

  return (
    <MainLayout title="Historial Quincenal" backTo="/">
      <div className="max-w-4xl mx-auto space-y-6">

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
          <div className="space-y-4">
            <div className="h-32 bg-black/5 rounded-3xl animate-pulse" />
            <div className="h-64 bg-black/5 rounded-3xl animate-pulse" />
          </div>
        ) : report ? (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Earnings */}
              <Card className="p-6 md:p-8 rounded-3xl bg-black text-white shadow-xl flex items-center justify-between overflow-hidden relative">
                <div className="absolute right-0 top-0 w-32 h-32 bg-white/5 rounded-bl-full -mr-10 -mt-10" />
                <div className="z-10">
                  <p className="text-white/60 font-medium mb-1 flex items-center gap-2 text-sm">
                    <DollarSign className="w-4 h-4 text-yellow-400" /> Pago Estimado
                  </p>
                  <h2 className="text-4xl font-display font-black text-yellow-400">
                    ${report.totalEarnings?.toFixed(2) || '0.00'}
                  </h2>
                  <p className="text-xs text-white/40 mt-2 font-medium">
                    ${((report.hourlyRate ?? 0) / 60).toFixed(3)}/min
                  </p>
                </div>
              </Card>

              {/* Time */}
              <Card className="p-6 md:p-8 rounded-3xl bg-white border-2 border-border shadow-md flex items-center">
                <div className="w-full">
                  <p className="text-muted-foreground font-medium mb-1 flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-primary" /> Tiempo Trabajado
                  </p>
                  <h2 className="text-4xl font-display font-black text-secondary">
                    {formatMinutes(report.totalHours ?? 0)}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-2 font-semibold bg-black/5 inline-block px-3 py-1 rounded-full">
                    {totalMinutes} minutos · ${report.hourlyRate}/hr
                  </p>
                </div>
              </Card>
            </div>

            {/* Daily Breakdown */}
            <div className="bg-white rounded-3xl shadow-sm border border-border overflow-hidden">
              <div className="p-5 border-b border-border bg-black/2 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center">
                  <Calendar className="w-5 h-5" />
                </div>
                <h3 className="font-display font-bold text-xl text-secondary">Desglose Diario</h3>
              </div>

              <div className="divide-y divide-border">
                {report.dailyBreakdown?.length > 0 ? (
                  report.dailyBreakdown.map((day, idx) => {
                    const dayMinutes = Math.round(day.totalHours * 60);
                    return (
                      <div key={idx} className="p-4 sm:p-5 hover:bg-black/2 transition-colors">
                        <div className="flex items-start justify-between gap-4">
                          {/* Date */}
                          <div className="flex items-start gap-4 flex-1 min-w-0">
                            <div className="w-14 text-center shrink-0">
                              <p className="text-xs font-bold text-muted-foreground uppercase">
                                {format(new Date(day.date + 'T12:00:00'), 'EEE', { locale: es })}
                              </p>
                              <p className="text-2xl font-display font-bold text-secondary">
                                {format(new Date(day.date + 'T12:00:00'), 'dd')}
                              </p>
                            </div>

                            {/* Records */}
                            <div className="flex-1 space-y-2 min-w-0">
                              {day.records.map((r, i) => (
                                <div key={i} className="flex items-center gap-2 flex-wrap">
                                  <span className="inline-flex items-center gap-1 text-sm font-semibold text-secondary bg-black/5 px-3 py-1.5 rounded-xl">
                                    <LogIn className="w-3.5 h-3.5 text-green-600" />
                                    {format(new Date(r.checkInAt), 'HH:mm')}
                                    {r.checkOutAt && (
                                      <>
                                        <span className="text-muted-foreground mx-0.5">→</span>
                                        <LogOut className="w-3.5 h-3.5 text-red-500" />
                                        {format(new Date(r.checkOutAt), 'HH:mm')}
                                      </>
                                    )}
                                    {!r.checkOutAt && (
                                      <span className="text-yellow-600 text-xs font-bold">(abierto)</span>
                                    )}
                                  </span>
                                  {r.hoursWorked ? (
                                    <span className="text-xs font-bold text-muted-foreground">
                                      {formatMinutes(r.hoursWorked)}
                                    </span>
                                  ) : null}
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Day totals */}
                          <div className="text-right shrink-0">
                            <p className="font-black text-secondary text-base">{formatMinutes(day.totalHours)}</p>
                            <p className="text-xs text-muted-foreground font-medium">{dayMinutes} min</p>
                            <p className="text-primary font-bold bg-primary/10 px-2 py-0.5 rounded-lg text-sm mt-1">
                              ${day.earnings.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })
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
