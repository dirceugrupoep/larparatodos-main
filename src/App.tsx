import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Payments from "./pages/Payments";
import Profile from "./pages/Profile";
import Project from "./pages/Project";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";
import AdminAssociations from "./pages/AdminAssociations";
import AdminAssociationDetails from "./pages/AdminAssociationDetails";
import AdminReports from "./pages/AdminReports";
import AssociationRegister from "./pages/AssociationRegister";
import AssociationLogin from "./pages/AssociationLogin";
import AssociationDashboard from "./pages/AssociationDashboard";
import AssociationSettings from "./pages/AssociationSettings";
import AssociationUsers from "./pages/AssociationUsers";
import AssociationReports from "./pages/AssociationReports";
import AssociationsList from "./pages/AssociationsList";
import AssociationProfile from "./pages/AssociationProfile";
import NotFound from "./pages/NotFound";
import { ProtectedAdminRoute } from "./components/ProtectedAdminRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Rotas de Associação */}
          <Route path="/association/register" element={<AssociationRegister />} />
          <Route path="/association/login" element={<AssociationLogin />} />
          <Route path="/association/dashboard" element={<AssociationDashboard />} />
          <Route path="/association/users" element={<AssociationUsers />} />
          <Route path="/association/reports" element={<AssociationReports />} />
          <Route path="/association/settings" element={<AssociationSettings />} />
          
          {/* Rotas Públicas de Associações */}
          <Route path="/associations" element={<AssociationsList />} />
          <Route path="/associations/:id" element={<AssociationProfile />} />
          {/* Rotas do Usuário */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard/payments" element={<Payments />} />
          <Route path="/dashboard/profile" element={<Profile />} />
          <Route path="/dashboard/project" element={<Project />} />
          
          {/* Rotas Administrativas - Protegidas */}
          <Route
            path="/admin"
            element={
              <ProtectedAdminRoute>
                <AdminDashboard />
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedAdminRoute>
                <AdminUsers />
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="/admin/associations"
            element={
              <ProtectedAdminRoute>
                <AdminAssociations />
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="/admin/associations/:id"
            element={
              <ProtectedAdminRoute>
                <AdminAssociationDetails />
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="/admin/reports"
            element={
              <ProtectedAdminRoute>
                <AdminReports />
              </ProtectedAdminRoute>
            }
          />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
