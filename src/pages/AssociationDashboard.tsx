import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Building2,
  Users,
  DollarSign,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Target,
  Zap,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { associationAuthApi, Association, associationDashboardApi, AssociationMetrics } from '@/lib/api';
import { AssociationLayout } from '@/components/AssociationLayout';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const AssociationDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [association, setAssociation] = useState<Association | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [metrics, setMetrics] = useState<AssociationMetrics | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const [associationData, metricsData] = await Promise.all([
        associationAuthApi.getCurrentAssociation(),
        associationDashboardApi.getMetrics(),
      ]);
      setAssociation(associationData.association);
      setMetrics(metricsData);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao carregar dados do dashboard',
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

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  if (isLoading) {
    return (
      <AssociationLayout>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Carregando dashboard...</p>
          </div>
        </div>
      </AssociationLayout>
    );
  }

  if (!metrics) {
    return null;
  }

  // Preparar dados para gráficos
  const revenueByMonthData = metrics.charts.revenueByMonth.map((item) => ({
    month: format(new Date(item.month + '-01'), 'MMM', { locale: ptBR }),
    receita: parseFloat(item.revenue.toString()),
  }));

  const revenueByDayData = metrics.charts.revenueByDay.map((item) => ({
    date: format(new Date(item.date), 'dd/MM'),
    receita: parseFloat(item.revenue.toString()),
  }));

  const complianceData = metrics.charts.complianceByMonth.map((item) => ({
    month: format(new Date(item.month + '-01'), 'MMM', { locale: ptBR }),
    pago: parseInt(item.paid.toString()),
    pendente: parseInt(item.pending.toString()),
    taxa: item.total > 0 ? (parseInt(item.paid.toString()) / parseInt(item.total.toString())) * 100 : 0,
  }));

  const userGrowthData = metrics.charts.userGrowth.map((item) => ({
    month: format(new Date(item.month + '-01'), 'MMM', { locale: ptBR }),
    novos: parseInt(item.new_users.toString()),
  }));

  const paymentStatusData = [
    { name: 'Pagos', value: metrics.payments.paid, color: '#10b981' },
    { name: 'Pendentes', value: metrics.payments.pending, color: '#f59e0b' },
    { name: 'Atrasados', value: metrics.payments.overdue, color: '#ef4444' },
  ];

  return (
    <AssociationLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary via-secondary to-accent p-8 text-white shadow-lg"
        >
          <div className="absolute inset-0 bg-black/10" />
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-4xl font-bold mb-2">
                  Dashboard - {association?.trade_name || association?.corporate_name}
                </h2>
                <p className="text-white/90 flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Visão Geral e Métricas
                </p>
              </div>
              <div className="hidden md:flex items-center gap-4">
                {association?.is_approved ? (
                  <div className="text-right">
                    <div className="text-2xl font-bold flex items-center gap-2">
                      <CheckCircle2 className="w-6 h-6" />
                      Ativa
                    </div>
                    <div className="text-sm text-white/80">Status aprovado</div>
                  </div>
                ) : (
                  <div className="text-right">
                    <div className="text-2xl font-bold flex items-center gap-2">
                      <Clock className="w-6 h-6" />
                      Aguardando
                    </div>
                    <div className="text-sm text-white/80">Aprovação pendente</div>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-3xl" />
        </motion.div>

        {/* Métricas Principais */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Receita Total */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            whileHover={{ scale: 1.05 }}
          >
            <Card className="relative overflow-hidden border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-secondary/10 hover:shadow-lg hover:shadow-primary/20 transition-all">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl" />
              <CardHeader className="pb-2 relative z-10">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-primary" />
                  Receita Total
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-1">
                  {formatCurrency(metrics.revenue.total)}
                </div>
                <div className="flex items-center gap-2 text-xs">
                  {metrics.revenue.growthRate >= 0 ? (
                    <>
                      <ArrowUpRight className="w-3 h-3 text-green-500" />
                      <span className="text-green-500">{formatPercent(metrics.revenue.growthRate)}</span>
                    </>
                  ) : (
                    <>
                      <ArrowDownRight className="w-3 h-3 text-red-500" />
                      <span className="text-red-500">{formatPercent(metrics.revenue.growthRate)}</span>
                    </>
                  )}
                  <span className="text-muted-foreground">vs mês anterior</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Total de Usuários */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            whileHover={{ scale: 1.05 }}
          >
            <Card className="relative overflow-hidden border-2 border-blue-500/30 bg-gradient-to-br from-blue-500/10 to-cyan-500/5 hover:shadow-lg hover:shadow-blue-500/20 transition-all">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl" />
              <CardHeader className="pb-2 relative z-10">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-500" />
                  Total de Usuários
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold text-blue-500 mb-1">
                  {metrics.users.total}
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground">{metrics.users.active} ativos</span>
                  {metrics.users.growthRate !== 0 && (
                    <>
                      {metrics.users.growthRate >= 0 ? (
                        <ArrowUpRight className="w-3 h-3 text-green-500" />
                      ) : (
                        <ArrowDownRight className="w-3 h-3 text-red-500" />
                      )}
                      <span className={metrics.users.growthRate >= 0 ? 'text-green-500' : 'text-red-500'}>
                        {formatPercent(metrics.users.growthRate)}
                      </span>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Taxa de Adimplência */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            whileHover={{ scale: 1.05 }}
          >
            <Card className="relative overflow-hidden border-2 border-green-500/30 bg-gradient-to-br from-green-500/10 to-emerald-500/5 hover:shadow-lg hover:shadow-green-500/20 transition-all">
              <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-2xl" />
              <CardHeader className="pb-2 relative z-10">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Target className="w-4 h-4 text-green-500" />
                  Taxa de Adimplência
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold text-green-500 mb-1">
                  {metrics.payments.complianceRate.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {metrics.payments.paid} de {metrics.payments.total} pagamentos
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Receita do Mês */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            whileHover={{ scale: 1.05 }}
          >
            <Card className="relative overflow-hidden border-2 border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-pink-500/5 hover:shadow-lg hover:shadow-purple-500/20 transition-all">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl" />
              <CardHeader className="pb-2 relative z-10">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Activity className="w-4 h-4 text-purple-500" />
                  Receita do Mês
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold text-purple-500 mb-1">
                  {formatCurrency(metrics.revenue.thisMonth)}
                </div>
                <div className="flex items-center gap-2 text-xs">
                  {metrics.revenue.growthRate >= 0 ? (
                    <>
                      <TrendingUp className="w-3 h-3 text-green-500" />
                      <span className="text-green-500">{formatPercent(metrics.revenue.growthRate)}</span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="w-3 h-3 text-red-500" />
                      <span className="text-red-500">{formatPercent(metrics.revenue.growthRate)}</span>
                    </>
                  )}
                  <span className="text-muted-foreground">crescimento</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Gráficos */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Receita por Mês */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Receita por Mês (Últimos 12 meses)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={revenueByMonthData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Area
                      type="monotone"
                      dataKey="receita"
                      stroke="#3b82f6"
                      fillOpacity={1}
                      fill="url(#colorRevenue)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          {/* Status de Pagamentos */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Status de Pagamentos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={paymentStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {paymentStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          {/* Taxa de Adimplência por Mês */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  Taxa de Adimplência por Mês
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={complianceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="pago" fill="#10b981" name="Pagos" />
                    <Bar dataKey="pendente" fill="#f59e0b" name="Pendentes" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          {/* Crescimento de Usuários */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Crescimento de Usuários
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={userGrowthData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="novos"
                      stroke="#8b5cf6"
                      strokeWidth={2}
                      dot={{ fill: '#8b5cf6', r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Receita Diária e Top Usuários */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Receita dos Últimos 30 Dias */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary" />
                  Receita Diária (Últimos 30 dias)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={revenueByDayData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Line
                      type="monotone"
                      dataKey="receita"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={{ fill: '#10b981', r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          {/* Top Usuários */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-primary" />
                  Top 10 Usuários por Contribuição
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {metrics.topUsers.length > 0 ? (
                    metrics.topUsers.map((user, index) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-primary">{formatCurrency(user.total_paid)}</p>
                          <p className="text-xs text-muted-foreground">{user.paid_count} pagamentos</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground py-8">Nenhum usuário encontrado</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Métricas Adicionais */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Receita Hoje</p>
                  <p className="text-2xl font-bold text-green-500">{formatCurrency(metrics.revenue.today)}</p>
                </div>
                <DollarSign className="w-8 h-8 text-green-500/50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Pagamentos Pendentes</p>
                  <p className="text-2xl font-bold text-yellow-500">{metrics.payments.pending}</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-500/50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Pagamentos Atrasados</p>
                  <p className="text-2xl font-bold text-red-500">{metrics.payments.overdue}</p>
                </div>
                <XCircle className="w-8 h-8 text-red-500/50" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AssociationLayout>
  );
};

export default AssociationDashboard;
