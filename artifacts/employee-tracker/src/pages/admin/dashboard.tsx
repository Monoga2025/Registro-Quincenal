import { useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EmployeesTab from "./tabs/employees-tab";
import ReportsTab from "./tabs/reports-tab";
import SettingsTab from "./tabs/settings-tab";
import { Users, FileText, Settings } from "lucide-react";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("employees");

  return (
    <MainLayout title="Panel de Administración">
      <div className="space-y-8">
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 p-1.5 bg-black/5 rounded-2xl mb-8">
            <TabsTrigger value="employees" className="rounded-xl font-bold py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary">
              <Users className="w-4 h-4 mr-2" /> Empleados
            </TabsTrigger>
            <TabsTrigger value="reports" className="rounded-xl font-bold py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary">
              <FileText className="w-4 h-4 mr-2" /> Reportes
            </TabsTrigger>
            <TabsTrigger value="settings" className="rounded-xl font-bold py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary">
              <Settings className="w-4 h-4 mr-2" /> Configuración
            </TabsTrigger>
          </TabsList>
          
          <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-border min-h-[500px]">
            <TabsContent value="employees" className="mt-0 outline-none">
              <EmployeesTab />
            </TabsContent>
            <TabsContent value="reports" className="mt-0 outline-none">
              <ReportsTab />
            </TabsContent>
            <TabsContent value="settings" className="mt-0 outline-none">
              <SettingsTab />
            </TabsContent>
          </div>
        </Tabs>

      </div>
    </MainLayout>
  );
}
