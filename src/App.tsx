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
import Certificates from "./pages/Certificates";
import CertificateViewer from "./pages/CertificateViewer";
import VerifyCertificate from "./pages/VerifyCertificate";
import AdminSites from "./pages/admin/AdminSites";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminReports from "./pages/admin/AdminReports";
import AdminRoles from "./pages/admin/AdminRoles";
import AdminAuditLog from "./pages/admin/AdminAuditLog";
import GovernanceDashboard from "./pages/governance/GovernanceDashboard";
import AuditDeepDive from "./pages/governance/AuditDeepDive";
import GovernanceCertificates from "./pages/governance/GovernanceCertificates";
import NotFound from "./pages/NotFound";

// Training pages
import Training from "./pages/training/Training";
import TrainingHistory from "./pages/training/TrainingHistory";
import ManageTraining from "./pages/training/ManageTraining";
import TrainingGroups from "./pages/training/TrainingGroups";
import TrainingOverview from "./pages/training/TrainingOverview";

// System pages
import UserStats from "./pages/system/UserStats";
import AIAccess from "./pages/system/AIAccess";

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
            
            {/* Public verification route */}
            <Route path="/verify/:id" element={<VerifyCertificate />} />
            
            {/* Main routes */}
            <Route path="/" element={<ProtectedWithSite><Index /></ProtectedWithSite>} />
            <Route path="/profile" element={<ProtectedWithSite><Profile /></ProtectedWithSite>} />
            
            {/* Procedure routes */}
            <Route path="/procedures" element={<ProtectedWithSite><Procedures /></ProtectedWithSite>} />
            <Route path="/procedures/new" element={<ProtectedWithSite><ProcedureEditor /></ProtectedWithSite>} />
            <Route path="/procedures/manage" element={<ProtectedWithSite><ManageProcedures /></ProtectedWithSite>} />
            <Route path="/procedures/:id" element={<ProtectedWithSite><ProcedureViewer /></ProtectedWithSite>} />
            <Route path="/procedures/:id/edit" element={<ProtectedWithSite><ProcedureEditor /></ProtectedWithSite>} />
            
            {/* Training routes */}
            <Route path="/training" element={<ProtectedWithSite><Training /></ProtectedWithSite>} />
            <Route path="/training/history" element={<ProtectedWithSite><TrainingHistory /></ProtectedWithSite>} />
            <Route path="/training/manage" element={<ProtectedWithSite><ManageTraining /></ProtectedWithSite>} />
            <Route path="/training/groups" element={<ProtectedWithSite><TrainingGroups /></ProtectedWithSite>} />
            <Route path="/training/overview" element={<ProtectedWithSite><TrainingOverview /></ProtectedWithSite>} />
            
            {/* Certificate routes (legacy - keeping for now) */}
            <Route path="/certificates" element={<ProtectedWithSite><Certificates /></ProtectedWithSite>} />
            <Route path="/certificates/:id" element={<ProtectedWithSite><CertificateViewer /></ProtectedWithSite>} />
            
            {/* Admin routes */}
            <Route path="/admin/sites" element={<ProtectedWithSite><AdminSites /></ProtectedWithSite>} />
            <Route path="/admin/users" element={<ProtectedWithSite><AdminUsers /></ProtectedWithSite>} />
            <Route path="/admin/settings" element={<ProtectedWithSite><AdminSettings /></ProtectedWithSite>} />
            <Route path="/admin/reports" element={<ProtectedWithSite><AdminReports /></ProtectedWithSite>} />
            <Route path="/admin/roles" element={<ProtectedWithSite><AdminRoles /></ProtectedWithSite>} />
            <Route path="/admin/audit" element={<ProtectedWithSite><AdminAuditLog /></ProtectedWithSite>} />
            
            {/* System routes (admin only) */}
            <Route path="/system/stats" element={<ProtectedWithSite><UserStats /></ProtectedWithSite>} />
            <Route path="/system/ai" element={<ProtectedWithSite><AIAccess /></ProtectedWithSite>} />
            
            {/* Governance routes (for external_client and auditor roles) */}
            <Route path="/governance" element={<ProtectedRoute><GovernanceDashboard /></ProtectedRoute>} />
            <Route path="/governance/audit" element={<ProtectedRoute><AuditDeepDive /></ProtectedRoute>} />
            <Route path="/governance/certificates" element={<ProtectedRoute><GovernanceCertificates /></ProtectedRoute>} />
            
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
