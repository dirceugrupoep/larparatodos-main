import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { UserPlus, Mail, Lock, User, Phone, Building2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { authApi, associationsApi, Association, termsApi } from '@/lib/api';
import logo from '@/assets/logo.png';
import { TermsModal } from '@/components/TermsModal';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const Register = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [associations, setAssociations] = useState<Association[]>([]);
  const [isLoadingAssociations, setIsLoadingAssociations] = useState(true);
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    cpf: '',
    association_id: undefined as number | undefined,
    // Guardamos o dia do mês escolhido (1-31)
    payment_day: today.getDate() as number,
    // Data completa apenas para o campo de calendário
    payment_date: todayStr,
    acceptedTerms: false,
  });
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [activeTermId, setActiveTermId] = useState<number | null>(null);

  useEffect(() => {
    loadAssociations();
    loadActiveTerm();
  }, []);

  const loadActiveTerm = async () => {
    try {
      const data = await termsApi.getActive();
      setActiveTermId(data.term.id);
    } catch (error) {
      console.error('Erro ao carregar termo:', error);
    }
  };

  const loadAssociations = async () => {
    try {
      setIsLoadingAssociations(true);
      const data = await associationsApi.getAll();
      setAssociations(data.associations);
      
      // Selecionar associação padrão automaticamente
      const defaultAssociation = data.associations.find(a => a.is_default);
      if (defaultAssociation) {
        setFormData(prev => ({ ...prev, association_id: defaultAssociation.id }));
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao carregar associações',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingAssociations(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: 'Erro',
        description: 'As senhas não coincidem',
        variant: 'destructive',
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: 'Erro',
        description: 'A senha deve ter pelo menos 6 caracteres',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.association_id) {
      toast({
        title: 'Erro',
        description: 'Por favor, selecione uma associação',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.acceptedTerms) {
      toast({
        title: 'Atenção',
        description: 'Você precisa aceitar os termos e condições para se cadastrar',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    if (!formData.cpf || formData.cpf.replace(/\D/g, '').length < 11) {
      toast({
        title: 'Erro',
        description: 'Por favor, preencha um CPF válido',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await authApi.register(
        formData.name,
        formData.email,
        formData.password,
        formData.phone || undefined,
        formData.cpf.replace(/\D/g, ''), // Enviar apenas números
        formData.association_id,
        formData.payment_day
      );
      
      // Registrar aceite do termo
      if (activeTermId) {
        try {
          await termsApi.acceptTerm(response.user.id, activeTermId);
        } catch (error) {
          console.error('Erro ao registrar aceite do termo:', error);
          // Não bloqueia o cadastro se houver erro ao registrar o aceite
        }
      }
      
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      
      toast({
        title: 'Cadastro realizado!',
        description: `Bem-vindo, ${response.user.name}!`,
      });

      navigate('/dashboard');
    } catch (error) {
      toast({
        title: 'Erro ao cadastrar',
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
                Criar conta
              </h1>
              <p className="text-muted-foreground">
                Preencha os dados para se cadastrar
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">
                  Nome completo
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Seu nome"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                    className="pl-10 h-12"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">
                  E-mail
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="seu@email.com"
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
                <label className="text-sm font-medium text-foreground mb-1.5 block">
                  Associação <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground z-10" />
                  <Select
                    value={formData.association_id?.toString() || ''}
                    onValueChange={(value) =>
                      setFormData({ ...formData, association_id: parseInt(value) })
                    }
                    disabled={isLoadingAssociations}
                  >
                    <SelectTrigger className="pl-10 h-12">
                      <SelectValue placeholder={isLoadingAssociations ? 'Carregando...' : 'Selecione uma associação'} />
                    </SelectTrigger>
                    <SelectContent>
                      {associations.map((association) => (
                        <SelectItem key={association.id} value={association.id.toString()}>
                          {association.trade_name || association.corporate_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">
                  CPF <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="000.000.000-00"
                    value={formData.cpf}
                    onChange={(e) => {
                      // Formatar CPF enquanto digita
                      let value = e.target.value.replace(/\D/g, '');
                      if (value.length <= 11) {
                        value = value.replace(/(\d{3})(\d)/, '$1.$2');
                        value = value.replace(/(\d{3})(\d)/, '$1.$2');
                        value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
                        setFormData({ ...formData, cpf: value });
                      }
                    }}
                    maxLength={14}
                    required
                    className="pl-10 h-12"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">
                  CPF é obrigatório para gerar cobranças
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">
                  Telefone (opcional)
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="tel"
                    placeholder="(11) 99999-9999"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="pl-10 h-12"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">
                  Dia de Pagamento <span className="text-red-500">*</span>
                </label>
                <Input
                  type="date"
                  value={formData.payment_date}
                  onChange={(e) => {
                    const value = e.target.value;
                    const date = new Date(value);
                    const day = date.getDate();
                    setFormData({
                      ...formData,
                      payment_date: value,
                      payment_day: day,
                    });
                  }}
                  className="h-12"
                />
                <p className="text-xs text-muted-foreground mt-1.5">
                  Escolha a data do primeiro vencimento. Vamos usar o mesmo dia em todos os meses seguintes.
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">
                  Senha
                </label>
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

              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">
                  Confirmar senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      setFormData({ ...formData, confirmPassword: e.target.value })
                    }
                    required
                    className="pl-10 h-12"
                  />
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 border border-border">
                <Checkbox
                  id="terms"
                  checked={formData.acceptedTerms}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, acceptedTerms: checked === true })
                  }
                  className="mt-1"
                />
                <label
                  htmlFor="terms"
                  className="text-sm text-foreground cursor-pointer flex-1"
                >
                  Eu aceito os{' '}
                  <button
                    type="button"
                    onClick={() => setShowTermsModal(true)}
                    className="text-primary hover:underline font-medium inline-flex items-center gap-1"
                  >
                    <FileText className="w-4 h-4" />
                    termos e condições de uso
                  </button>
                </label>
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 h-12 font-semibold"
                disabled={isLoading || !formData.acceptedTerms}
              >
                {isLoading ? 'Cadastrando...' : 'Cadastrar'}
              </Button>
            </form>

            <TermsModal
              open={showTermsModal}
              onOpenChange={setShowTermsModal}
              onAccept={() => {
                setFormData({ ...formData, acceptedTerms: true });
                setShowTermsModal(false);
              }}
            />

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Já tem uma conta?{' '}
                <Link
                  to="/login"
                  className="text-primary hover:underline font-medium"
                >
                  Faça login
                </Link>
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;

