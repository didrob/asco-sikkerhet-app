import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import { SiteProvider } from "@/contexts/SiteContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import Procedures from "./pages/Procedures";
import ProcedureViewer from "./pages/ProcedureViewer";
import ProcedureEditor from "./pages/ProcedureEditor";
import ManageProcedures from "./pages/ManageProcedures";
import AdminSites from "./pages/admin/AdminSites";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminReports from "./pages/admin/AdminReports";
import AdminRoles from "./pages/admin/AdminRoles";
import AdminAuditLog from "./pages/admin/AdminAuditLog";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Wrapper component for protected routes with SiteProvider
function ProtectedWithSite({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <SiteProvider>
        {children}
      </SiteProvider>
    </ProtectedRoute>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
            <Route path="/auth" element={<Auth />} />
            
            {/* Main routes */}
            <Route path="/" element={<ProtectedWithSite><Index /></ProtectedWithSite>} />
            <Route path="/profile" element={<ProtectedWithSite><Profile /></ProtectedWithSite>} />
            
            {/* Procedure routes */}
            <Route path="/procedures" element={<ProtectedWithSite><Procedures /></ProtectedWithSite>} />
            <Route path="/procedures/new" element={<ProtectedWithSite><ProcedureEditor /></ProtectedWithSite>} />
            <Route path="/procedures/manage" element={<ProtectedWithSite><ManageProcedures /></ProtectedWithSite>} />
            <Route path="/procedures/:id" element={<ProtectedWithSite><ProcedureViewer /></ProtectedWithSite>} />
            <Route path="/procedures/:id/edit" element={<ProtectedWithSite><ProcedureEditor /></ProtectedWithSite>} />
            
            {/* Admin routes */}
            <Route path="/admin/sites" element={<ProtectedWithSite><AdminSites /></ProtectedWithSite>} />
            <Route path="/admin/users" element={<ProtectedWithSite><AdminUsers /></ProtectedWithSite>} />
            <Route path="/admin/settings" element={<ProtectedWithSite><AdminSettings /></ProtectedWithSite>} />
            <Route path="/admin/reports" element={<ProtectedWithSite><AdminReports /></ProtectedWithSite>} />
            <Route path="/admin/roles" element={<ProtectedWithSite><AdminRoles /></ProtectedWithSite>} />
            <Route path="/admin/audit" element={<ProtectedWithSite><AdminAuditLog /></ProtectedWithSite>} />
            
              {/* Catch-all */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
