import { useState } from "react";
import { useListEmployees, useCreateEmployee, useDeleteEmployee, getListEmployeesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { UserPlus, Trash2, Edit2, Search } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";

const employeeSchema = z.object({
  fullName: z.string().min(2, "Nombre requerido"),
  username: z.string().min(3, "Usuario requerido"),
  password: z.string().min(4, "Contraseña requerida"),
  position: z.string().min(2, "Puesto requerido"),
  role: z.enum(["admin", "employee"]).default("employee"),
});

type EmployeeForm = z.infer<typeof employeeSchema>;

export default function EmployeesTab() {
  const { data: employees, isLoading } = useListEmployees();
  const createMutation = useCreateEmployee();
  const deleteMutation = useDeleteEmployee();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<EmployeeForm>({
    resolver: zodResolver(employeeSchema)
  });

  const onSubmit = async (data: EmployeeForm) => {
    try {
      await createMutation.mutateAsync({ data });
      queryClient.invalidateQueries({ queryKey: getListEmployeesQueryKey() });
      setIsDialogOpen(false);
      reset();
      toast({ title: "Empleado creado exitosamente" });
    } catch (e) {
      toast({ variant: "destructive", title: "Error al crear empleado" });
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("¿Estás seguro de eliminar este empleado?")) {
      try {
        await deleteMutation.mutateAsync({ id });
        queryClient.invalidateQueries({ queryKey: getListEmployeesQueryKey() });
        toast({ title: "Empleado eliminado" });
      } catch (e) {
        toast({ variant: "destructive", title: "Error al eliminar" });
      }
    }
  };

  const filteredEmployees = employees?.filter(e => 
    e.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    e.position?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input 
            placeholder="Buscar empleados..." 
            className="pl-10 py-5 rounded-xl bg-black/5 border-transparent focus:bg-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="py-5 px-6 rounded-xl font-bold bg-primary text-secondary hover:bg-primary/90 shadow-lg shadow-primary/20">
              <UserPlus className="w-5 h-5 mr-2" /> Nuevo Empleado
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md rounded-3xl p-6">
            <DialogHeader>
              <DialogTitle className="font-display text-2xl">Agregar Empleado</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-secondary">Nombre Completo</label>
                <Input {...register("fullName")} className="rounded-xl py-5" />
                {errors.fullName && <p className="text-xs text-destructive">{errors.fullName.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-secondary">Usuario</label>
                  <Input {...register("username")} className="rounded-xl py-5" />
                  {errors.username && <p className="text-xs text-destructive">{errors.username.message}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-secondary">Contraseña</label>
                  <Input type="password" {...register("password")} className="rounded-xl py-5" />
                  {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-secondary">Puesto</label>
                  <Input {...register("position")} className="rounded-xl py-5" />
                  {errors.position && <p className="text-xs text-destructive">{errors.position.message}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-secondary">Rol</label>
                  <select {...register("role")} className="w-full rounded-xl py-3 px-3 border border-border bg-white outline-none focus:ring-2 focus:ring-primary focus:border-transparent">
                    <option value="employee">Empleado</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
              </div>
              <Button type="submit" disabled={createMutation.isPending} className="w-full py-6 rounded-xl font-bold mt-4">
                {createMutation.isPending ? "Guardando..." : "Guardar Empleado"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border border-border rounded-2xl overflow-hidden">
        <Table>
          <TableHeader className="bg-black/2">
            <TableRow>
              <TableHead className="font-bold text-secondary py-4">Empleado</TableHead>
              <TableHead className="font-bold text-secondary">Puesto</TableHead>
              <TableHead className="font-bold text-secondary text-center">Rol</TableHead>
              <TableHead className="font-bold text-secondary text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={4} className="h-24 text-center">Cargando...</TableCell></TableRow>
            ) : filteredEmployees.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="h-32 text-center text-muted-foreground">No se encontraron empleados.</TableCell></TableRow>
            ) : (
              filteredEmployees.map((emp) => (
                <TableRow key={emp.id} className="hover:bg-black/2">
                  <TableCell className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold">
                        {emp.fullName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-secondary">{emp.fullName}</p>
                        <p className="text-xs text-muted-foreground">@{emp.username}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium text-secondary">{emp.position}</TableCell>
                  <TableCell className="text-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${emp.role === 'admin' ? 'bg-secondary text-white' : 'bg-primary/20 text-secondary'}`}>
                      {emp.role === 'admin' ? 'Admin' : 'Empleado'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-secondary">
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(emp.id)} className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
