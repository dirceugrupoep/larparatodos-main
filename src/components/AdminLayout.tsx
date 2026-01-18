import { ReactNode, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogOut, Users, BarChart3, FileText, Shield, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { authApi } from '@/lib/api';
import logo from '@/assets/logo.png';

interface AdminLayoutProps {
  children: ReactNode;
}

const navItems = [
  { path: '/admin', label: 'Dashboard', icon: BarChart3 },
  { path: '/admin/users', label: 'Usuários', icon: Users },
  { path: '/admin/associations', label: 'Associações', icon: Building2 },
  { path: '/admin/reports', label: 'Relatórios', icon: FileText },
];

export const AdminLayout = ({ children }: AdminLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
      navigate('/login');
      return;
    }

    const userData = JSON.parse(userStr);
    setUser(userData);

    // Verificar se é admin
    checkAdmin();
  }, [navigate]);

  const checkAdmin = async () => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        navigate('/login');
        return;
      }

      const userData = JSON.parse(userStr);
      
      if (!userData.is_admin) {
        // Tentar buscar dados atualizados
        try {
          const data = await authApi.getCurrentUser();
          if (!data.user?.is_admin) {
            toast({
              title: 'Acesso negado',
              description: 'Você não tem permissão para acessar esta área',
              variant: 'destructive',
            });
            navigate('/dashboard');
            return;
          }
          setIsAdmin(true);
          setUser(data.user);
          localStorage.setItem('user', JSON.stringify(data.user));
        } catch {
          toast({
            title: 'Acesso negado',
            description: 'Você não tem permissão para acessar esta área',
            variant: 'destructive',
          });
          navigate('/dashboard');
        }
      } else {
        setIsAdmin(true);
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao verificar permissões',
        variant: 'destructive',
      });
      navigate('/dashboard');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
    toast({
      title: 'Logout realizado',
      description: 'Você foi desconectado com sucesso',
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img 
                src={logo} 
                alt="Lar Para Todos" 
                className="h-14 object-contain"
              />
              <div>
                <h1 className="text-xl font-bold text-foreground">
                  Painel Administrativo
                </h1>
                <p className="text-sm text-muted-foreground">
                  {user?.name}
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={handleLogout} size="sm">
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Navigation */}
          <aside className="lg:w-64 flex-shrink-0">
            <nav className="space-y-2">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground font-semibold'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
    </div>
  );
};

