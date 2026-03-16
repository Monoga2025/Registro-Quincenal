import { useState } from "react";
import { useGetBiweeklyReport } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Download, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function ReportsTab() {
  const today = new Date();
  const defaultPeriod = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  
  const [period, setPeriod] = useState(defaultPeriod);
  
  const { data: report, isLoading } = useGetBiweeklyReport({ period });

  const navigatePeriod = (dir: 'prev' | 'next') => {
    const [year, month] = period.split('-');
    let y = parseInt(year);
    let m = parseInt(month);

    if (dir === 'prev') {
       m -= 1; if (m < 1) { m = 12; y -= 1; }
    } else {
       m += 1; if (m > 12) { m = 1; y += 1; }
    }
    setPeriod(`${y}-${String(m).padStart(2, '0')}`);
  };

  const monthName = format(new Date(`${period}-02`), 'MMMM yyyy', { locale: es });

  return (
    <div className="space-y-6">
      
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-black/2 p-4 rounded-2xl border border-border">
        <div className="flex items-center gap-2 bg-white rounded-xl shadow-sm border border-border p-1">
          <Button variant="ghost" size="icon" onClick={() => navigatePeriod('prev')}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="w-40 text-center font-display font-bold text-secondary capitalize">
            {monthName}
          </div>
          <Button variant="ghost" size="icon" onClick={() => navigatePeriod('next')}>
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>

        <Button className="rounded-xl font-bold bg-secondary text-primary hover:bg-black w-full sm:w-auto">
          <Download className="w-4 h-4 mr-2" /> Exportar CSV
        </Button>
      </div>

      {isLoading ? (
        <div className="h-64 bg-black/5 rounded-2xl animate-pulse" />
      ) : report ? (
        <>
          {/* Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-primary/10 border border-primary/20 rounded-2xl p-6">
              <p className="text-secondary/70 font-bold text-sm mb-1 flex items-center gap-2">
                <DollarSign className="w-4 h-4" /> Total Nómina
              </p>
              <p className="text-3xl font-display font-bold text-secondary">
                ${report.totalPayout?.toFixed(2) || '0.00'}
              </p>
            </div>
            <div className="bg-black/5 border border-border rounded-2xl p-6">
              <p className="text-muted-foreground font-bold text-sm mb-1">Empleados Activos</p>
              <p className="text-3xl font-display font-bold text-secondary">
                {report.employees?.length || 0}
              </p>
            </div>
          </div>

          {/* Data Table */}
          <div className="border border-border rounded-2xl overflow-hidden">
            <Table>
              <TableHeader className="bg-black/2">
                <TableRow>
                  <TableHead className="font-bold text-secondary py-4">Empleado</TableHead>
                  <TableHead className="font-bold text-secondary text-right">Horas</TableHead>
                  <TableHead className="font-bold text-secondary text-right">Tarifa</TableHead>
                  <TableHead className="font-bold text-secondary text-right">Total a Pagar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.employees?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                      No hay datos registrados para este periodo.
                    </TableCell>
                  </TableRow>
                ) : (
                  report.employees?.map((emp) => (
                    <TableRow key={emp.employeeId} className="hover:bg-black/2">
                      <TableCell className="py-4 font-medium text-secondary">
                        {emp.fullName}
                        <span className="block text-xs text-muted-foreground">{emp.position}</span>
                      </TableCell>
                      <TableCell className="text-right font-medium">{emp.totalHours.toFixed(1)} h</TableCell>
                      <TableCell className="text-right text-muted-foreground">${emp.hourlyRate}/h</TableCell>
                      <TableCell className="text-right">
                        <span className="bg-primary/20 text-secondary font-bold px-3 py-1 rounded-lg">
                          ${emp.totalEarnings.toFixed(2)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </>
      ) : (
        <div className="p-12 text-center border border-dashed border-border rounded-2xl">
          Error al cargar el reporte.
        </div>
      )}
    </div>
  );
}
