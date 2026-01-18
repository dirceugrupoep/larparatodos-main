import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { authApi } from '@/lib/api';

interface ProtectedAdminRouteProps {
  children: React.ReactNode;
}

export const ProtectedAdminRoute = ({ children }: ProtectedAdminRouteProps) => {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');

        if (!token || !userStr) {
          setIsAdmin(false);
          setIsLoading(false);
          return;
        }

        const userData = JSON.parse(userStr);
        
        // Verificar se o usuário é admin
        if (userData.is_admin) {
          setIsAdmin(true);
          setIsLoading(false);
          return;
        }

        // Tentar buscar dados atualizados da API para confirmar
        try {
          const data = await authApi.getCurrentUser();
          if (data.user?.is_admin) {
            setIsAdmin(true);
            // Atualizar localStorage com dados atualizados
            localStorage.setItem('user', JSON.stringify(data.user));
          } else {
            setIsAdmin(false);
          }
        } catch {
          setIsAdmin(false);
        }
      } catch (error) {
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAdmin();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

