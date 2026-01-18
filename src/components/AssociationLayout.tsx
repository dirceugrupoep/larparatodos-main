import { useEffect, useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Building2,
  LogOut,
  BarChart3,
  Users,
  FileText,
  Settings,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Association } from '@/lib/api';
import logo from '@/assets/logo.png';

interface AssociationLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { path: '/association/dashboard', label: 'Dashboard', icon: BarChart3 },
  { path: '/association/users', label: 'Usuários', icon: Users },
  { path: '/association/reports', label: 'Relatórios', icon: FileText },
  { path: '/association/settings', label: 'Configurações', icon: Settings },
];

export const AssociationLayout = ({ children }: AssociationLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [association, setAssociation] = useState<Association | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('association_token');
    const associationStr = localStorage.getItem('association');

    if (!token || !associationStr) {
      navigate('/association/login');
      return;
    }

    try {
      const associationData = JSON.parse(associationStr);
      setAssociation(associationData);
    } catch (error) {
      navigate('/association/login');
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('association_token');
    localStorage.removeItem('association');
    navigate('/association/login');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-card border-r border-border z-40">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-border">
            <div className="flex items-center justify-center">
              <img 
                src={logo} 
                alt="Lar Para Todos" 
                className="h-14 object-contain"
              />
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link key={item.path} to={item.path}>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </motion.div>
                </Link>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-border">
            <Button
              variant="ghost"
              className="w-full justify-start text-muted-foreground hover:text-foreground"
              onClick={handleLogout}
            >
              <LogOut className="w-5 h-5 mr-3" />
              Sair
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 p-6">
        {children}
      </main>
    </div>
  );
};

