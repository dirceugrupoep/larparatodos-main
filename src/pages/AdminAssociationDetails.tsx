import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Building2,
  Users,
  DollarSign,
  ArrowLeft,
  Search,
  Mail,
  Phone,
  MapPin,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { adminApi, Association, AdminUser, TOTAL_PARCELAS_MESES } from '@/lib/api';
import { AdminLayout } from '@/components/AdminLayout';

const AdminAssociationDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [association, setAssociation] = useState<Association | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });

  useEffect(() => {
    if (id) {
      loadAllData();
    }
  }, [id]);

  useEffect(() => {
    if (id && association) {
      loadUsers();
    }
  }, [page, search, id, association]);

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadAssociationDetails(),
        loadMetrics(),
        loadUsers(), // Carregar usuários também no início
      ]);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAssociationDetails = async () => {
    if (!id) return;
    try {
      const data = await adminApi.getAssociations();
      const found = data.associations.find((a) => a.id === parseInt(id));
      if (found) {
        setAssociation(found);
      } else {
        toast({
          title: 'Erro',
          description: 'Associação não encontrada',
          variant: 'destructive',
        });
        navigate('/admin/associations');
      }
    } catch (error) {
      console.error('Erro ao carregar associação:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar associação',
        variant: 'destructive',
      });
    }
  };

  const loadUsers = async () => {
    if (!id) return;
    try {
      setIsLoadingUsers(true);
      const data = await adminApi.getAssociationUsers(parseInt(id), {
        page,
        limit: 20,
        search: search || undefined,
      });
      setUsers(data.users);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar usuários',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const loadMetrics = async () => {
    if (!id) return;
    try {
      const data = await adminApi.getAssociationMetrics(parseInt(id));
      setMetrics(data);
    } catch (error) {
      console.error('Erro ao carregar métricas:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar métricas',
        variant: 'destructive',
      });
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  if (isLoading || !association) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Carregando...</p>
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
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/admin/associations')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-2">
                {association.trade_name || association.corporate_name}
              </h2>
              <p className="text-muted-foreground">{association.corporate_name}</p>
            </div>
          </div>
        </div>

        {/* Métricas Principais */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                Total de Usuários
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-1">
                {metrics?.users?.total ?? (association.total_users ? parseInt(String(association.total_users)) : 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                {metrics?.users?.active ?? (association.active_users ? parseInt(String(association.active_users)) : 0)} ativos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-green-500" />
                Receita Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-500 mb-1">
                {formatCurrency(
                  metrics?.revenue?.total ?? 
                  (association.total_revenue ? parseFloat(String(association.total_revenue)) : 0)
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(metrics?.revenue.thisMonth || 0)} este mês
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-500" />
                Pagamentos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-1">
                {metrics?.payments?.paid ?? (association.paid_payments ? parseInt(String(association.paid_payments)) : 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                parcelas pagas (240 meses por cooperado)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="w-4 h-4 text-yellow-500" />
                Pendentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-500 mb-1">
                {metrics?.payments?.pending || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {metrics?.payments?.overdue || 0} em atraso
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Informações da Associação */}
        <Card>
          <CardHeader>
            <CardTitle>Informações da Associação</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">CNPJ</p>
                <p className="font-medium">{association.cnpj}</p>
              </div>
              {association.email && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">E-mail</p>
                  <p className="font-medium">{association.email}</p>
                </div>
              )}
              {association.phone && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Telefone</p>
                  <p className="font-medium">{association.phone}</p>
                </div>
              )}
              {association.city && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Cidade/Estado</p>
                  <p className="font-medium">
                    {association.city}, {association.state}
                  </p>
                </div>
              )}
              <div className="flex items-center gap-2">
                {association.is_active ? (
                  <Badge className="bg-green-500">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Ativa
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    <XCircle className="w-3 h-3 mr-1" />
                    Inativa
                  </Badge>
                )}
                {association.is_approved ? (
                  <Badge className="bg-blue-500">Aprovada</Badge>
                ) : (
                  <Badge className="bg-yellow-500">Aguardando Aprovação</Badge>
                )}
                {association.is_default && (
                  <Badge className="bg-purple-500">Padrão</Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Usuários */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Usuários da Associação</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar usuários..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingUsers ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Carregando usuários...</p>
              </div>
            ) : users.length > 0 ? (
              <>
                <div className="space-y-2">
                  {users.map((user) => (
                    <motion.div
                      key={user.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h4 className="font-semibold">{user.name}</h4>
                          {user.is_active ? (
                            <Badge className="bg-green-500">Ativo</Badge>
                          ) : (
                            <Badge variant="destructive">Inativo</Badge>
                          )}
                          {user.is_admin && <Badge className="bg-purple-500">Admin</Badge>}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1 min-w-0 max-w-full">
                            <Mail className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate" title={user.email}>{user.email}</span>
                          </span>
                          {user.phone && (
                            <span className="flex items-center gap-1 min-w-0">
                              <Phone className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">{user.phone}</span>
                            </span>
                          )}
                          {user.cpf && (
                            <span className="min-w-0 truncate font-mono">CPF: {user.cpf}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span>Parcelas: {user.paid_payments || 0}/{TOTAL_PARCELAS_MESES}</span>
                          <span>Total pago: {formatCurrency(parseFloat(user.total_paid) || 0)}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
                {pagination.pages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-muted-foreground">
                      Página {pagination.page} de {pagination.pages} ({pagination.total} usuários)
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                      >
                        Anterior
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                        disabled={page === pagination.pages}
                      >
                        Próxima
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">Nenhum usuário encontrado</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminAssociationDetails;

