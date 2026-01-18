import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Building2, Mail, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { associationAuthApi } from '@/lib/api';
import logo from '@/assets/logo.png';

const AssociationLogin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsLoading(true);

    try {
      const response = await associationAuthApi.login(
        formData.email,
        formData.password
      );

      localStorage.setItem('association_token', response.token);
      localStorage.setItem('association', JSON.stringify(response.association));

      toast({
        title: 'Login realizado!',
        description: `Bem-vindo, ${response.association.corporate_name}!`,
      });

      navigate('/association/dashboard');
    } catch (error) {
      toast({
        title: 'Erro ao fazer login',
        description: error instanceof Error ? error.message : 'Tente novamente',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 to-secondary/30 rounded-2xl blur-xl" />
          <div className="relative p-8 rounded-2xl bg-card border border-border shadow-lg">
            <div className="text-center mb-8">
              <img 
                src={logo} 
                alt="Lar Para Todos" 
                className="w-24 h-24 object-contain mx-auto mb-4"
              />
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Login Associação
              </h1>
              <p className="text-muted-foreground">
                Entre com sua conta de associação
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="contato@associacao.com.br"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    required
                    className="pl-10 h-12"
                  />
                </div>
              </div>

              <div>
                <Label>Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    required
                    className="pl-10 h-12"
                  />
                </div>
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 h-12 font-semibold"
                disabled={isLoading}
              >
                {isLoading ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Não tem uma conta?{' '}
                <Link
                  to="/association/register"
                  className="text-primary hover:underline font-medium"
                >
                  Cadastre-se
                </Link>
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AssociationLogin;

