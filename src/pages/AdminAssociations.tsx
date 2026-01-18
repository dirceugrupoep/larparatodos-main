import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Building2,
  Plus,
  Edit,
  Trash2,
  Search,
  CheckCircle2,
  XCircle,
  Star,
  Mail,
  Phone,
  MapPin,
  Globe,
  Users,
  DollarSign,
  Eye,
  Power,
  Clock,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { adminApi, AdminAssociation } from '@/lib/api';
import { AdminLayout } from '@/components/AdminLayout';
import { Textarea } from '@/components/ui/textarea';

const AdminAssociationsPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [associations, setAssociations] = useState<AdminAssociation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedAssociation, setSelectedAssociation] = useState<AdminAssociation | null>(null);
  const [formData, setFormData] = useState({
    cnpj: '',
    corporate_name: '',
    trade_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    website: '',
    is_active: true,
    is_default: false,
  });

  useEffect(() => {
    loadAssociations();
  }, []);

  const loadAssociations = async () => {
    try {
      setIsLoading(true);
      console.log('Carregando associações...');
      const data = await adminApi.getAssociations();
      console.log('Associações carregadas:', data);
      setAssociations(data.associations || []);
      console.log('Associações definidas no estado:', data.associations?.length || 0);
    } catch (error) {
      console.error('Erro ao carregar associações:', error);
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao carregar associações',
        variant: 'destructive',
      });
      setAssociations([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setIsEditMode(false);
    setSelectedAssociation(null);
    setFormData({
      cnpj: '',
      corporate_name: '',
      trade_name: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      zip_code: '',
      website: '',
      is_active: true,
      is_default: false,
    });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (association: AdminAssociation) => {
    setIsEditMode(true);
    setSelectedAssociation(association);
    setFormData({
      cnpj: association.cnpj,
      corporate_name: association.corporate_name,
      trade_name: association.trade_name || '',
      email: association.email || '',
      phone: association.phone || '',
      address: association.address || '',
      city: association.city || '',
      state: association.state || '',
      zip_code: association.zip_code || '',
      website: association.website || '',
      is_active: association.is_active,
      is_default: association.is_default,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    try {
      if (isEditMode && selectedAssociation) {
        await adminApi.updateAssociation(selectedAssociation.id, formData);
        toast({
          title: 'Sucesso!',
          description: 'Associação atualizada com sucesso',
        });
      } else {
        await adminApi.createAssociation(formData);
        toast({
          title: 'Sucesso!',
          description: 'Associação criada com sucesso',
        });
      }
      setIsDialogOpen(false);
      loadAssociations();
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao salvar associação',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja deletar esta associação?')) {
      return;
    }

    try {
      await adminApi.deleteAssociation(id);
      toast({
        title: 'Sucesso!',
        description: 'Associação deletada com sucesso',
      });
      loadAssociations();
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao deletar associação',
        variant: 'destructive',
      });
    }
  };

  const handleToggleActive = async (id: number) => {
    try {
      const response = await adminApi.toggleAssociationActive(id);
      toast({
        title: 'Sucesso!',
        description: response.message || 'Status da associação alterado com sucesso',
      });
      loadAssociations();
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao alterar status',
        variant: 'destructive',
      });
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value || 0);
  };

  const filteredAssociations = associations.filter((association) => {
    const searchLower = search.toLowerCase();
    return (
      association.corporate_name.toLowerCase().includes(searchLower) ||
      (association.trade_name && association.trade_name.toLowerCase().includes(searchLower)) ||
      association.cnpj.includes(searchLower) ||
      (association.email && association.email.toLowerCase().includes(searchLower))
    );
  });

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Carregando associações...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2">
              Gestão de Associações
            </h2>
            <p className="text-muted-foreground">
              Cadastre e gerencie as associações do sistema
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleOpenCreate} className="bg-gradient-to-r from-primary to-secondary">
                <Plus className="w-4 h-4 mr-2" />
                Nova Associação
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {isEditMode ? 'Editar Associação' : 'Nova Associação'}
                </DialogTitle>
                <DialogDescription>
                  {isEditMode
                    ? 'Atualize as informações da associação'
                    : 'Preencha os dados para cadastrar uma nova associação'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>CNPJ <span className="text-red-500">*</span></Label>
                    <Input
                      value={formData.cnpj}
                      onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                      placeholder="00.000.000/0001-00"
                      required
                    />
                  </div>
                  <div>
                    <Label>Razão Social <span className="text-red-500">*</span></Label>
                    <Input
                      value={formData.corporate_name}
                      onChange={(e) => setFormData({ ...formData, corporate_name: e.target.value })}
                      placeholder="Razão Social da Empresa"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label>Nome Fantasia</Label>
                  <Input
                    value={formData.trade_name}
                    onChange={(e) => setFormData({ ...formData, trade_name: e.target.value })}
                    placeholder="Nome Fantasia"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="contato@empresa.com.br"
                    />
                  </div>
                  <div>
                    <Label>Telefone</Label>
                    <Input
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                </div>

                <div>
                  <Label>Endereço</Label>
                  <Textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Rua, número, complemento"
                    rows={2}
                  />
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <Label>Cidade</Label>
                    <Input
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="Cidade"
                    />
                  </div>
                  <div>
                    <Label>Estado</Label>
                    <Input
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value.toUpperCase() })}
                      placeholder="SP"
                      maxLength={2}
                    />
                  </div>
                  <div>
                    <Label>CEP</Label>
                    <Input
                      value={formData.zip_code}
                      onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                      placeholder="00000-000"
                    />
                  </div>
                </div>

                <div>
                  <Label>Website</Label>
                  <Input
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    placeholder="https://www.empresa.com.br"
                  />
                </div>

                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <Label>Ativa</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.is_default}
                      onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <Label>Associação Padrão</Label>
                  </div>
                </div>

                <Button onClick={handleSubmit} className="w-full">
                  {isEditMode ? 'Atualizar' : 'Criar'} Associação
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Busca */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, CNPJ ou email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Lista de Associações */}
        <div className="grid gap-4">
          {filteredAssociations.map((association) => (
            <motion.div
              key={association.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="hover:border-primary/40 transition-all shadow-sm">
                <CardContent className="p-6">
                  {/* Header com nome e badges */}
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-md">
                        <Building2 className="w-7 h-7 text-primary-foreground" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold text-foreground">
                            {association.trade_name || association.corporate_name}
                          </h3>
                          <div className="flex items-center gap-2">
                            {association.is_default && (
                              <Badge className="bg-yellow-500 hover:bg-yellow-600">
                                <Star className="w-3 h-3 mr-1" />
                                Padrão
                              </Badge>
                            )}
                            {association.is_active ? (
                              <Badge className="bg-green-500 hover:bg-green-600">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Ativa
                              </Badge>
                            ) : (
                              <Badge variant="destructive">
                                <XCircle className="w-3 h-3 mr-1" />
                                Inativa
                              </Badge>
                            )}
                            {association.is_approved && (
                              <Badge className="bg-blue-500 hover:bg-blue-600">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Aprovada
                              </Badge>
                            )}
                          </div>
                        </div>
                        {association.trade_name && (
                          <p className="text-sm text-muted-foreground">
                            {association.corporate_name}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {/* Botões de ação */}
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => navigate(`/admin/associations/${association.id}`)}
                        className="bg-primary hover:bg-primary/90"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Detalhes
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleActive(association.id)}
                      >
                        <Power className="w-4 h-4 mr-2" />
                        {association.is_active ? 'Desativar' : 'Ativar'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenEdit(association)}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Editar
                      </Button>
                      {!association.is_default && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(association.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Deletar
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Métricas em cards */}
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="p-4 rounded-lg border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <Users className="w-5 h-5 text-primary" />
                      </div>
                      <p className="text-xs text-muted-foreground mb-1">Usuários</p>
                      <p className="text-2xl font-bold text-foreground mb-1">
                        {typeof association.total_users === 'string' 
                          ? parseInt(association.total_users) 
                          : (association.total_users || 0)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {typeof association.active_users === 'string'
                          ? parseInt(association.active_users)
                          : (association.active_users || 0)} ativos
                      </p>
                    </div>

                    <div className="p-4 rounded-lg border border-green-500/20 bg-green-500/5 hover:bg-green-500/10 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <DollarSign className="w-5 h-5 text-green-600" />
                      </div>
                      <p className="text-xs text-muted-foreground mb-1">Receita Total</p>
                      <p className="text-xl font-bold text-green-600">
                        {formatCurrency(
                          typeof association.total_revenue === 'string'
                            ? parseFloat(association.total_revenue) || 0
                            : (association.total_revenue || 0)
                        )}
                      </p>
                    </div>

                    <div className="p-4 rounded-lg border border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <CheckCircle2 className="w-5 h-5 text-blue-600" />
                      </div>
                      <p className="text-xs text-muted-foreground mb-1">Pagamentos</p>
                      <p className="text-2xl font-bold text-foreground mb-1">
                        {typeof association.paid_payments === 'string'
                          ? parseInt(association.paid_payments)
                          : (association.paid_payments || 0)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        de {typeof association.total_payments === 'string'
                          ? parseInt(association.total_payments)
                          : (association.total_payments || 0)} total
                      </p>
                    </div>

                    <div className="p-4 rounded-lg border border-purple-500/20 bg-purple-500/5 hover:bg-purple-500/10 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <Clock className="w-5 h-5 text-purple-600" />
                      </div>
                      <p className="text-xs text-muted-foreground mb-1">Status</p>
                      <p className="text-lg font-bold text-foreground">
                        {association.is_active ? 'Ativa' : 'Inativa'}
                      </p>
                      {association.is_approved && (
                        <p className="text-xs text-green-600 font-medium mt-1">✓ Aprovada</p>
                      )}
                    </div>
                  </div>

                  {/* Informações de contato */}
                  <div className="border-t pt-4">
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-semibold text-muted-foreground">CNPJ:</span>
                        <span className="text-foreground">{association.cnpj}</span>
                      </div>
                      {association.email && (
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          <span className="text-foreground">{association.email}</span>
                        </div>
                      )}
                      {association.phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          <span className="text-foreground">{association.phone}</span>
                        </div>
                      )}
                      {association.city && (
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          <span className="text-foreground">
                            {association.city}, {association.state}
                          </span>
                        </div>
                      )}
                      {association.website && (
                        <div className="flex items-center gap-2 text-sm">
                          <Globe className="w-4 h-4 text-muted-foreground" />
                          <a
                            href={association.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline font-medium"
                          >
                            Website
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {filteredAssociations.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {search ? 'Nenhuma associação encontrada' : 'Nenhuma associação cadastrada'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminAssociationsPage;

