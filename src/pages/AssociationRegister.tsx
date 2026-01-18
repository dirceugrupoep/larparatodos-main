import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Building2, Mail, Lock, FileText, Phone, MapPin, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { associationAuthApi } from '@/lib/api';
import logo from '@/assets/logo.png';

// Função para validar CNPJ
function validateCNPJ(cnpj: string): boolean {
  const cleanCNPJ = cnpj.replace(/[^\d]+/g, '');
  
  if (cleanCNPJ.length !== 14) return false;
  
  // Eliminar CNPJs conhecidos como inválidos
  if (/^(\d)\1+$/.test(cleanCNPJ)) return false;
  
  // Validar dígitos verificadores
  let length = cleanCNPJ.length - 2;
  let numbers = cleanCNPJ.substring(0, length);
  const digits = cleanCNPJ.substring(length);
  let sum = 0;
  let pos = length - 7;
  
  for (let i = length; i >= 1; i--) {
    sum += parseInt(numbers.charAt(length - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  
  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0))) return false;
  
  length = length + 1;
  numbers = cleanCNPJ.substring(0, length);
  sum = 0;
  pos = length - 7;
  
  for (let i = length; i >= 1; i--) {
    sum += parseInt(numbers.charAt(length - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  
  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(1))) return false;
  
  return true;
}

// Função para formatar CNPJ
function formatCNPJ(value: string): string {
  const numbers = value.replace(/\D/g, '');
  if (numbers.length <= 14) {
    return numbers
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  }
  return value;
}

const AssociationRegister = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [cnpjError, setCnpjError] = useState('');
  const [formData, setFormData] = useState({
    cnpj: '',
    corporate_name: '',
    trade_name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    website: '',
  });

  const handleCNPJChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCNPJ(e.target.value);
    setFormData({ ...formData, cnpj: formatted });
    
    // Validar CNPJ em tempo real
    if (formatted.replace(/\D/g, '').length === 14) {
      if (!validateCNPJ(formatted)) {
        setCnpjError('CNPJ inválido');
      } else {
        setCnpjError('');
      }
    } else {
      setCnpjError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validações
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

    if (!validateCNPJ(formData.cnpj)) {
      toast({
        title: 'Erro',
        description: 'CNPJ inválido',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.corporate_name || !formData.email) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos obrigatórios',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      await associationAuthApi.register({
        cnpj: formData.cnpj,
        corporate_name: formData.corporate_name,
        trade_name: formData.trade_name || undefined,
        email: formData.email,
        password: formData.password,
        phone: formData.phone || undefined,
        address: formData.address || undefined,
        city: formData.city || undefined,
        state: formData.state || undefined,
        zip_code: formData.zip_code || undefined,
        website: formData.website || undefined,
      });

      toast({
        title: 'Cadastro realizado!',
        description: 'Sua associação foi cadastrada e está aguardando aprovação do administrador.',
      });

      navigate('/');
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
        className="w-full max-w-2xl"
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
                Cadastrar Associação
              </h1>
              <p className="text-muted-foreground">
                Preencha os dados da sua associação
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>
                    CNPJ <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="00.000.000/0001-00"
                      value={formData.cnpj}
                      onChange={handleCNPJChange}
                      maxLength={18}
                      required
                      className={`pl-10 h-12 ${cnpjError ? 'border-red-500' : ''}`}
                    />
                  </div>
                  {cnpjError && (
                    <p className="text-sm text-red-500 mt-1">{cnpjError}</p>
                  )}
                </div>

                <div>
                  <Label>
                    Razão Social <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="text"
                    placeholder="Razão Social da Empresa"
                    value={formData.corporate_name}
                    onChange={(e) =>
                      setFormData({ ...formData, corporate_name: e.target.value })
                    }
                    required
                    className="h-12"
                  />
                </div>
              </div>

              <div>
                <Label>Nome Fantasia</Label>
                <Input
                  type="text"
                  placeholder="Nome Fantasia"
                  value={formData.trade_name}
                  onChange={(e) =>
                    setFormData({ ...formData, trade_name: e.target.value })
                  }
                  className="h-12"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>
                    E-mail <span className="text-red-500">*</span>
                  </Label>
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
                  <Label>Telefone</Label>
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
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>
                    Senha <span className="text-red-500">*</span>
                  </Label>
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
                  <Label>
                    Confirmar Senha <span className="text-red-500">*</span>
                  </Label>
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
              </div>

              <div>
                <Label>Endereço</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                  <Textarea
                    placeholder="Rua, número, complemento"
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    className="pl-10"
                    rows={2}
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <Label>Cidade</Label>
                  <Input
                    type="text"
                    placeholder="Cidade"
                    value={formData.city}
                    onChange={(e) =>
                      setFormData({ ...formData, city: e.target.value })
                    }
                    className="h-12"
                  />
                </div>

                <div>
                  <Label>Estado</Label>
                  <Input
                    type="text"
                    placeholder="SP"
                    value={formData.state}
                    onChange={(e) =>
                      setFormData({ ...formData, state: e.target.value.toUpperCase() })
                    }
                    maxLength={2}
                    className="h-12"
                  />
                </div>

                <div>
                  <Label>CEP</Label>
                  <Input
                    type="text"
                    placeholder="00000-000"
                    value={formData.zip_code}
                    onChange={(e) =>
                      setFormData({ ...formData, zip_code: e.target.value })
                    }
                    className="h-12"
                  />
                </div>
              </div>

              <div>
                <Label>Website</Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="url"
                    placeholder="https://www.associacao.com.br"
                    value={formData.website}
                    onChange={(e) =>
                      setFormData({ ...formData, website: e.target.value })
                    }
                    className="pl-10 h-12"
                  />
                </div>
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 h-12 font-semibold"
                disabled={isLoading || !!cnpjError}
              >
                {isLoading ? 'Cadastrando...' : 'Cadastrar Associação'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Já tem uma conta?{' '}
                <Link
                  to="/association/login"
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

export default AssociationRegister;

