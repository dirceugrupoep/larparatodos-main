import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  DollarSign,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { associationDashboardApi, AssociationUser, TOTAL_PARCELAS_MESES } from '@/lib/api';
import { AssociationLayout } from '@/components/AssociationLayout';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const AssociationUsers = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [users, setUsers] = useState<AssociationUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    loadUsers();
  }, [page, search, statusFilter]);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const data = await associationDashboardApi.getUsers(page, 20, search);
      
      let filteredUsers = data.users;
      if (statusFilter === 'active') {
        filteredUsers = data.users.filter((u) => u.is_active);
      } else if (statusFilter === 'inactive') {
        filteredUsers = data.users.filter((u) => !u.is_active);
      } else if (statusFilter === 'overdue') {
        filteredUsers = data.users.filter((u) => u.overdue_payments > 0);
      }

      setUsers(filteredUsers);
      setTotalPages(data.pagination.pages);
      setTotal(data.pagination.total);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao carregar usuários',
        variant: 'destructive',
      });
      navigate('/association/login');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getStatusBadge = (user: AssociationUser) => {
    if (!user.is_active) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <XCircle className="w-3 h-3 mr-1" />
          Inativo
        </span>
      );
    }
    if (user.overdue_payments > 0) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <AlertCircle className="w-3 h-3 mr-1" />
          Atrasado
        </span>
      );
    }
    if (user.pending_payments > 0) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <Clock className="w-3 h-3 mr-1" />
          Pendente
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <CheckCircle2 className="w-3 h-3 mr-1" />
        Em Dia
      </span>
    );
  };

  const exportUsers = () => {
    const csv = [
      ['Nome', 'Email', 'CPF', 'Status', 'Total Pago', 'Pagamentos', 'Pendentes', 'Atrasados'].join(','),
      ...users.map((user) =>
        [
          user.name,
          user.email,
          user.cpf || '',
          user.is_active ? 'Ativo' : 'Inativo',
          user.total_paid,
          user.paid_payments,
          user.pending_payments,
          user.overdue_payments,
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `usuarios-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: 'Sucesso',
      description: 'Lista de usuários exportada com sucesso',
    });
  };

  return (
    <AssociationLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Usuários</h1>
            <p className="text-muted-foreground">
              Gerencie e visualize todos os usuários da sua associação
            </p>
          </div>
          <Button onClick={exportUsers} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Exportar CSV
          </Button>
        </motion.div>

        {/* Filtros e Busca */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, email ou CPF..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Ativos</SelectItem>
                  <SelectItem value="inactive">Inativos</SelectItem>
                  <SelectItem value="overdue">Com Atraso</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Estatísticas */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total de Usuários</p>
                  <p className="text-2xl font-bold">{total}</p>
                </div>
                <Users className="w-8 h-8 text-primary/50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Usuários Ativos</p>
                  <p className="text-2xl font-bold text-green-500">
                    {users.filter((u) => u.is_active).length}
                  </p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-green-500/50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Com Pendências</p>
                  <p className="text-2xl font-bold text-yellow-500">
                    {users.filter((u) => u.pending_payments > 0).length}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-yellow-500/50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Com Atraso</p>
                  <p className="text-2xl font-bold text-red-500">
                    {users.filter((u) => u.overdue_payments > 0).length}
                  </p>
                </div>
                <AlertCircle className="w-8 h-8 text-red-500/50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Usuários */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Carregando usuários...</p>
            </div>
          </div>
        ) : users.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhum usuário encontrado</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {users.map((user, index) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="text-lg font-semibold text-foreground">{user.name}</h3>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                            {user.phone && (
                              <p className="text-sm text-muted-foreground">{user.phone}</p>
                            )}
                          </div>
                          {getStatusBadge(user)}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">CPF</p>
                            <p className="text-sm font-medium">{user.cpf || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Localização</p>
                            <p className="text-sm font-medium">
                              {user.city && user.state ? `${user.city}, ${user.state}` : 'N/A'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Cadastrado em</p>
                            <p className="text-sm font-medium">
                              {format(new Date(user.created_at), "dd 'de' MMM 'de' yyyy", { locale: ptBR })}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Total Pago</p>
                            <p className="text-sm font-bold text-green-500">
                              {formatCurrency(user.total_paid)}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 md:min-w-[200px]">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-green-50 dark:bg-green-950/20 p-3 rounded-lg">
                            <p className="text-xs text-muted-foreground mb-1">Parcelas pagas</p>
                            <p className="text-lg font-bold text-green-600">{user.paid_payments}/{TOTAL_PARCELAS_MESES}</p>
                          </div>
                          <div className="bg-yellow-50 dark:bg-yellow-950/20 p-3 rounded-lg">
                            <p className="text-xs text-muted-foreground mb-1">Pendentes</p>
                            <p className="text-lg font-bold text-yellow-600">{user.pending_payments}</p>
                          </div>
                          <div className="bg-red-50 dark:bg-red-950/20 p-3 rounded-lg">
                            <p className="text-xs text-muted-foreground mb-1">Atrasados</p>
                            <p className="text-lg font-bold text-red-600">{user.overdue_payments}</p>
                          </div>
                          <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg">
                            <p className="text-xs text-muted-foreground mb-1">Total</p>
                            <p className="text-lg font-bold text-blue-600">{TOTAL_PARCELAS_MESES}</p>
                          </div>
                        </div>
                        {user.pending_amount > 0 && (
                          <div className="bg-orange-50 dark:bg-orange-950/20 p-3 rounded-lg">
                            <p className="text-xs text-muted-foreground mb-1">Valor Pendente</p>
                            <p className="text-lg font-bold text-orange-600">
                              {formatCurrency(user.pending_amount)}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Paginação */}
        {totalPages > 1 && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Mostrando {((page - 1) * 20) + 1} a {Math.min(page * 20, total)} de {total} usuários
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Anterior
                  </Button>
                  <span className="text-sm font-medium">
                    Página {page} de {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Próxima
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AssociationLayout>
  );
};

export default AssociationUsers;

