import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Mail,
  CheckCircle2,
  AlertCircle,
  Clock,
  UserCheck,
  UserX,
  Calendar,
  CreditCard,
  Sparkles,
  Activity,
  BarChart3,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { adminApi, AdminDashboard } from '@/lib/api';
import { AdminLayout } from '@/components/AdminLayout';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const AdminDashboardPage = () => {
  const { toast } = useToast();
  const [data, setData] = useState<AdminDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const dashboardData = await adminApi.getDashboard();
      setData(dashboardData);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao carregar dados do dashboard',
        variant: 'destructive',
      });
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

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Carregando métricas...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!data) return null;

  // Preparar dados para gráficos
  const formatMonth = (monthStr: string) => {
    if (!monthStr) return 'N/A';
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
  };

  const revenueChartData = (data.trends?.revenueByMonth || []).map((item: any) => ({
    month: formatMonth(item.month),
    receita: parseFloat(item.total || item.sum || 0),
  }));

  const paymentsChartData = (data.trends?.paymentsByMonth || []).map((item: any) => ({
    month: formatMonth(item.month),
    pagamentos: parseInt(item.count || 0),
  }));

  const pieData = [
    { name: 'Pagos', value: data.payments.paid, color: '#22c55e' },
    { name: 'Pendentes', value: data.payments.pending, color: '#eab308' },
    { name: 'Em Atraso', value: data.payments.overdue, color: '#ef4444' },
  ];

  const COLORS = ['#22c55e', '#eab308', '#ef4444'];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header com gradiente */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary via-secondary to-accent p-8 text-white shadow-lg"
        >
          <div className="absolute inset-0 bg-black/10" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <BarChart3 className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-4xl font-bold mb-1">
                  Dashboard Administrativo
                </h2>
                <p className="text-white/90 flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Métricas em tempo real
                </p>
              </div>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-3xl" />
        </motion.div>

        {/* Métricas de Usuários */}
        <div>
          <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Usuários
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-6 gap-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, type: 'spring' }}
              whileHover={{ scale: 1.05 }}
            >
              <Card className="relative overflow-hidden border-2 border-primary/20 hover:border-primary/40 transition-all group bg-gradient-to-br from-primary/5 to-primary/10">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-colors" />
                <CardHeader className="pb-2 relative z-10">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" />
                    Total de Usuários
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    {data.users.total}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Cadastrados no sistema
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              whileHover={{ scale: 1.05 }}
            >
              <Card className="relative overflow-hidden border-2 border-green-500/20 hover:border-green-500/40 transition-all group bg-gradient-to-br from-green-500/5 to-emerald-500/10">
                <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-2xl group-hover:bg-green-500/20 transition-colors" />
                <CardHeader className="pb-2 relative z-10">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-green-500" />
                    Ativos
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="text-4xl font-bold text-green-500">
                    {data.users.active}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {((data.users.active / data.users.total) * 100).toFixed(1)}% do total
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <UserX className="w-4 h-4 text-red-500" />
                    Inativos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-red-500">
                    {data.users.inactive}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Novos Hoje
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">
                    {data.users.newToday}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Novos no Mês
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">
                    {data.users.newThisMonth}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Administradores
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">
                    {data.users.admins}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>

        {/* Métricas de Receita */}
        <div>
          <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Receita
          </h3>
          <div className="grid md:grid-cols-3 gap-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7, type: 'spring' }}
              whileHover={{ scale: 1.05 }}
            >
              <Card className="relative overflow-hidden border-2 border-green-500/30 bg-gradient-to-br from-green-500/10 via-emerald-500/5 to-green-500/10 hover:shadow-lg hover:shadow-green-500/20 transition-all group">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent" />
                <div className="absolute top-0 right-0 w-40 h-40 bg-green-500/10 rounded-full blur-3xl" />
                <CardHeader className="pb-2 relative z-10">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-green-500" />
                    Receita Hoje
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="text-4xl font-bold text-green-500 mb-1">
                    {formatCurrency(data.revenue.today)}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-green-600">
                    <TrendingUp className="w-3 h-3" />
                    <span>Hoje</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8, type: 'spring' }}
              whileHover={{ scale: 1.05 }}
            >
              <Card className="relative overflow-hidden border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-secondary/10 hover:shadow-lg hover:shadow-primary/20 transition-all group">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
                <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 rounded-full blur-3xl" />
                <CardHeader className="pb-2 relative z-10">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    Receita do Mês
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-1">
                    {formatCurrency(data.revenue.thisMonth)}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-primary">
                    <Sparkles className="w-3 h-3" />
                    <span>Este mês</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.9, type: 'spring' }}
              whileHover={{ scale: 1.05 }}
            >
              <Card className="relative overflow-hidden border-2 border-secondary/30 bg-gradient-to-br from-secondary/10 via-amber-500/5 to-secondary/10 hover:shadow-lg hover:shadow-secondary/20 transition-all group">
                <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-transparent" />
                <div className="absolute top-0 right-0 w-40 h-40 bg-secondary/10 rounded-full blur-3xl" />
                <CardHeader className="pb-2 relative z-10">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-secondary" />
                    Receita Total
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="text-4xl font-bold text-secondary mb-1">
                    {formatCurrency(data.revenue.total)}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-secondary">
                    <Sparkles className="w-3 h-3" />
                    <span>Acumulado</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>

        {/* Métricas de Pagamentos */}
        <div>
          <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Pagamentos
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0 }}
            >
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">
                    {data.payments.total}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1 }}
            >
              <Card className="border-green-500/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    Pagos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-500">
                    {data.payments.paid}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 }}
            >
              <Card className="border-yellow-500/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Clock className="w-4 h-4 text-yellow-500" />
                    Pendentes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-500">
                    {data.payments.pending}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.3 }}
            >
              <Card className="border-red-500/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    Em Atraso
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-500">
                    {data.payments.overdue}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.4 }}
            >
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Ticket Médio
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">
                    {formatCurrency(data.payments.avgValue)}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>

        {/* Status de Adimplência */}
        <div className="grid md:grid-cols-2 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5 }}
          >
            <Card className="border-green-500/20 bg-green-500/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  Adimplentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-green-500 mb-2">
                  {data.payments.adimplentes}
                </div>
                <p className="text-sm text-muted-foreground">
                  Usuários em dia com os pagamentos
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.6 }}
          >
            <Card className="border-red-500/20 bg-red-500/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  Inadimplentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-red-500 mb-2">
                  {data.payments.inadimplentes}
                </div>
                <p className="text-sm text-muted-foreground">
                  Usuários com pagamentos em atraso
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Gráficos */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Gráfico de Receita */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.0 }}
          >
            <Card className="border-2 border-primary/20 hover:border-primary/40 transition-all">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Receita por Mês
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={revenueChartData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number) => formatCurrency(value)}
                    />
                    <Area
                      type="monotone"
                      dataKey="receita"
                      stroke="hsl(var(--primary))"
                      fillOpacity={1}
                      fill="url(#colorRevenue)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          {/* Gráfico de Pagamentos */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.1 }}
          >
            <Card className="border-2 border-secondary/20 hover:border-secondary/40 transition-all">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-secondary" />
                  Pagamentos por Mês
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={paymentsChartData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="pagamentos" fill="hsl(var(--secondary))" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Gráfico de Pizza - Status de Pagamentos */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.2 }}
        >
          <Card className="border-2 border-accent/20 hover:border-accent/40 transition-all">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-accent" />
                Distribuição de Pagamentos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-4">
                  {pieData.map((item, index) => (
                    <div key={item.name} className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: COLORS[index] }}
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{item.name}</span>
                          <span className="text-sm text-muted-foreground">{item.value}</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2 mt-1">
                          <div
                            className="h-2 rounded-full transition-all"
                            style={{
                              width: `${(item.value / data.payments.total) * 100}%`,
                              backgroundColor: COLORS[index],
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Métricas de Contatos */}
        <div>
          <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Contatos
          </h3>
          <div className="grid md:grid-cols-3 gap-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 2.3, type: 'spring' }}
              whileHover={{ scale: 1.05 }}
            >
              <Card className="relative overflow-hidden border-2 border-blue-500/20 hover:border-blue-500/40 transition-all group bg-gradient-to-br from-blue-500/5 to-blue-500/10">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl" />
                <CardHeader className="pb-2 relative z-10">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total de Contatos
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="text-4xl font-bold text-blue-500">
                    {data.contacts.total}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 2.4, type: 'spring' }}
              whileHover={{ scale: 1.05 }}
            >
              <Card className="relative overflow-hidden border-2 border-purple-500/20 hover:border-purple-500/40 transition-all group bg-gradient-to-br from-purple-500/5 to-purple-500/10">
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl" />
                <CardHeader className="pb-2 relative z-10">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Contatos Hoje
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="text-4xl font-bold text-purple-500">
                    {data.contacts.today}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 2.5, type: 'spring' }}
              whileHover={{ scale: 1.05 }}
            >
              <Card className="relative overflow-hidden border-2 border-pink-500/20 hover:border-pink-500/40 transition-all group bg-gradient-to-br from-pink-500/5 to-pink-500/10">
                <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/10 rounded-full blur-2xl" />
                <CardHeader className="pb-2 relative z-10">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Contatos no Mês
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="text-4xl font-bold text-pink-500">
                    {data.contacts.thisMonth}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboardPage;

