import { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogOut, Home, Wallet, User, FileText, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import logo from '@/assets/logo.png';

interface DashboardLayoutProps {
  children: ReactNode;
}

const navItems = [
  { path: '/dashboard', label: 'Início', icon: Home },
  { path: '/dashboard/payments', label: 'Pagamentos', icon: Wallet },
  { path: '/dashboard/profile', label: 'Perfil', icon: User },
  { path: '/dashboard/project', label: 'Andamento', icon: FileText },
];

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

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
                  Painel do Cooperado
                </h1>
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

