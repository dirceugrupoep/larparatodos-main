import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Search,
  Edit,
  Key,
  UserCheck,
  UserX,
  Shield,
  Mail,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  Filter,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { adminApi, AdminUser } from '@/lib/api';
import { AdminLayout } from '@/components/AdminLayout';

const AdminUsersPage = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [editData, setEditData] = useState<Partial<AdminUser>>({});
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    loadUsers();
  }, [pagination.page, search, statusFilter]);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const data = await adminApi.getUsers({
        page: pagination.page,
        limit: pagination.limit,
        search: search || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      });
      setUsers(data.users);
      setPagination(data.pagination);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao carregar usuários',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    setPagination({ ...pagination, page: 1 });
  };

  const handleEdit = (user: AdminUser) => {
    setSelectedUser(user);
    setEditData({
      name: user.name,
      email: user.email,
      phone: user.phone,
      is_admin: user.is_admin,
      is_active: user.is_active,
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedUser) return;

    try {
      await adminApi.updateUser(selectedUser.id, editData);
      toast({
        title: 'Sucesso!',
        description: 'Usuário atualizado com sucesso',
      });
      setIsEditDialogOpen(false);
      loadUsers();
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao atualizar usuário',
        variant: 'destructive',
      });
    }
  };

  const handleResetPassword = async () => {
    if (!selectedUser || !newPassword) return;

    if (newPassword.length < 6) {
      toast({
        title: 'Erro',
        description: 'A senha deve ter pelo menos 6 caracteres',
        variant: 'destructive',
      });
      return;
    }

    try {
      await adminApi.resetPassword(selectedUser.id, newPassword);
      toast({
        title: 'Sucesso!',
        description: 'Senha resetada com sucesso',
      });
      setIsPasswordDialogOpen(false);
      setNewPassword('');
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao resetar senha',
        variant: 'destructive',
      });
    }
  };

  const handleToggleActive = async (user: AdminUser) => {
    try {
      await adminApi.toggleUserActive(user.id);
      toast({
        title: 'Sucesso!',
        description: `Usuário ${user.is_active ? 'desativado' : 'ativado'} com sucesso`,
      });
      loadUsers();
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
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-3xl font-bold text-foreground mb-2">
            Gestão de Usuários
          </h2>
          <p className="text-muted-foreground">
            Gerencie todos os usuários do sistema
          </p>
        </div>

        {/* Filtros e Busca */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, email ou CPF..."
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-muted-foreground" />
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPagination({ ...pagination, page: 1 });
                  }}
                  className="px-3 py-2 rounded-md border border-border bg-background text-foreground"
                >
                  <option value="all">Todos</option>
                  <option value="active">Ativos</option>
                  <option value="inactive">Inativos</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Usuários */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Carregando usuários...</p>
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {users.map((user) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <h3 className="text-lg font-semibold text-foreground">
                              {user.name}
                            </h3>
                            {user.is_admin && (
                              <Badge className="bg-purple-500">
                                <Shield className="w-3 h-3 mr-1" />
                                Admin
                              </Badge>
                            )}
                            {user.is_active ? (
                              <Badge className="bg-green-500">
                                <UserCheck className="w-3 h-3 mr-1" />
                                Ativo
                              </Badge>
                            ) : (
                              <Badge variant="destructive">
                                <UserX className="w-3 h-3 mr-1" />
                                Inativo
                              </Badge>
                            )}
                          </div>

                          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Mail className="w-4 h-4" />
                              {user.email}
                            </div>
                            {user.phone && (
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Phone className="w-4 h-4" />
                                {user.phone}
                              </div>
                            )}
                            {user.cpf && (
                              <div className="flex items-center gap-2 text-muted-foreground">
                                CPF: {user.cpf}
                              </div>
                            )}
                            {user.city && (
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <MapPin className="w-4 h-4" />
                                {user.city}, {user.state}
                              </div>
                            )}
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Calendar className="w-4 h-4" />
                              {formatDate(user.created_at)}
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <DollarSign className="w-4 h-4" />
                              Total pago: {formatCurrency(parseFloat(user.total_paid || '0'))}
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              Pagamentos: {user.paid_payments}/{user.total_payments}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(user)}
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Editar
                          </Button>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedUser(user)}
                              >
                                <Key className="w-4 h-4 mr-2" />
                                Resetar Senha
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Resetar Senha</DialogTitle>
                                <DialogDescription>
                                  Definir nova senha para {user.name}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <div>
                                  <Label>Nova Senha</Label>
                                  <Input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="••••••••"
                                  />
                                </div>
                                <Button
                                  onClick={() => {
                                    setSelectedUser(user);
                                    handleResetPassword();
                                  }}
                                  className="w-full"
                                >
                                  Confirmar
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                          <Button
                            variant={user.is_active ? 'destructive' : 'default'}
                            size="sm"
                            onClick={() => handleToggleActive(user)}
                          >
                            {user.is_active ? (
                              <>
                                <UserX className="w-4 h-4 mr-2" />
                                Desativar
                              </>
                            ) : (
                              <>
                                <UserCheck className="w-4 h-4 mr-2" />
                                Ativar
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Paginação */}
            {pagination.pages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Mostrando {((pagination.page - 1) * pagination.limit) + 1} a{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} de{' '}
                  {pagination.total} usuários
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setPagination({ ...pagination, page: pagination.page - 1 })
                    }
                    disabled={pagination.page === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Anterior
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Página {pagination.page} de {pagination.pages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setPagination({ ...pagination, page: pagination.page + 1 })
                    }
                    disabled={pagination.page >= pagination.pages}
                  >
                    Próxima
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Dialog de Edição */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Usuário</DialogTitle>
              <DialogDescription>
                Atualize as informações do usuário
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Nome</Label>
                <Input
                  value={editData.name || ''}
                  onChange={(e) =>
                    setEditData({ ...editData, name: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={editData.email || ''}
                  onChange={(e) =>
                    setEditData({ ...editData, email: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Telefone</Label>
                <Input
                  value={editData.phone || ''}
                  onChange={(e) =>
                    setEditData({ ...editData, phone: e.target.value })
                  }
                />
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editData.is_admin || false}
                    onChange={(e) =>
                      setEditData({ ...editData, is_admin: e.target.checked })
                    }
                    className="w-4 h-4"
                  />
                  <Label>Administrador</Label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editData.is_active !== false}
                    onChange={(e) =>
                      setEditData({ ...editData, is_active: e.target.checked })
                    }
                    className="w-4 h-4"
                  />
                  <Label>Ativo</Label>
                </div>
              </div>
              <Button onClick={handleSaveEdit} className="w-full">
                Salvar Alterações
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminUsersPage;

