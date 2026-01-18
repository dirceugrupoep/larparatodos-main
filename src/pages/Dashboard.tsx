import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users,
  Mail,
  User,
  Calendar,
  Phone,
  MessageSquare,
  Wallet,
  FileText,
  ArrowRight,
  DollarSign,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Clock,
  Activity,
  Target,
  Sparkles,
  BarChart3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { dashboardApi, User as UserType, paymentsApi, projectApi, Payment, termsApi } from '@/lib/api';
import { DashboardLayout } from '@/components/DashboardLayout';
import { TermsModal } from '@/components/TermsModal';
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

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<UserType | null>(null);
  const [stats, setStats] = useState({ totalUsers: 0, totalContacts: 0 });
  const [recentContacts, setRecentContacts] = useState<any[]>([]);
  const [paymentStats, setPaymentStats] = useState<any>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [projectStatus, setProjectStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [termAcceptance, setTermAcceptance] = useState<{ accepted: boolean; acceptance: any; term: any } | null>(null);
  const [showTermsModal, setShowTermsModal] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
      navigate('/login');
      return;
    }

    const userData = JSON.parse(userStr);
    setUser(userData);
    loadDashboardData();
  }, [navigate]);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const [statsData, contactsData, paymentsData, paymentsList, projectData, termData] = await Promise.all([
        dashboardApi.getStats(),
        dashboardApi.getRecentContacts(),
        paymentsApi.getStats().catch(() => null),
        paymentsApi.getPayments().catch(() => ({ payments: [] })),
        projectApi.getStatus().catch(() => null),
        user ? termsApi.checkUserAcceptance(user.id).catch(() => null) : Promise.resolve(null),
      ]);

      setStats(statsData.stats);
      setRecentContacts(contactsData.contacts);
      setPaymentStats(paymentsData?.stats || null);
      setPayments(paymentsList.payments || []);
      setProjectStatus(projectData?.status || null);
      setTermAcceptance(termData);
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

  // Preparar dados para gráficos
  const preparePaymentChartData = () => {
    const last6Months = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
      
      const monthPayments = payments.filter((p) => {
        const paymentDate = new Date(p.due_date);
        return paymentDate.getMonth() === date.getMonth() && 
               paymentDate.getFullYear() === date.getFullYear();
      });

      const paid = monthPayments
        .filter((p) => p.status === 'paid')
        .reduce((sum, p) => sum + p.amount, 0);
      
      const pending = monthPayments
        .filter((p) => p.status === 'pending')
        .reduce((sum, p) => sum + p.amount, 0);

      last6Months.push({
        month: monthKey,
        pago: paid,
        pendente: pending,
      });
    }

    return last6Months;
  };

  const paymentStatusData = [
    { name: 'Pagos', value: payments.filter((p) => p.status === 'paid').length, color: '#22c55e' },
    { name: 'Pendentes', value: payments.filter((p) => p.status === 'pending').length, color: '#eab308' },
    { name: 'Em Atraso', value: payments.filter((p) => {
      const dueDate = new Date(p.due_date);
      return p.status === 'pending' && dueDate < new Date();
    }).length, color: '#ef4444' },
  ];

  const COLORS = ['#22c55e', '#eab308', '#ef4444'];

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Carregando...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome Section com Gradiente */}
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
                  Bem-vindo, {user?.name}!
                </h2>
                <p className="text-white/90 flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Acompanhe seu progresso na cooperativa
                </p>
              </div>
              <div className="hidden md:flex items-center gap-4">
                {paymentStats?.isAdimplente ? (
                  <div className="text-right">
                    <div className="text-2xl font-bold">Adimplente</div>
                    <div className="text-sm text-white/80">Status em dia</div>
                  </div>
                ) : (
                  <div className="text-right">
                    <div className="text-2xl font-bold">Atenção</div>
                    <div className="text-sm text-white/80">Verifique pagamentos</div>
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
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, type: 'spring' }}
            whileHover={{ scale: 1.05 }}
          >
            <Card className={`relative overflow-hidden border-2 transition-all group ${
              paymentStats?.isAdimplente 
                ? 'border-green-500/30 bg-gradient-to-br from-green-500/10 to-emerald-500/5 hover:shadow-lg hover:shadow-green-500/20' 
                : 'border-red-500/30 bg-gradient-to-br from-red-500/10 to-rose-500/5 hover:shadow-lg hover:shadow-red-500/20'
            }`}>
              <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl ${
                paymentStats?.isAdimplente ? 'bg-green-500/10' : 'bg-red-500/10'
              }`} />
              <CardHeader className="pb-2 relative z-10">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  {paymentStats?.isAdimplente ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-500" />
                  )}
                  Status de Pagamento
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold mb-1">
                  {paymentStats?.isAdimplente ? (
                    <span className="text-green-500">Adimplente</span>
                  ) : (
                    <span className="text-red-500">Inadimplente</span>
                  )}
                </div>
                {paymentStats?.nextPayment && (
                  <p className="text-xs text-muted-foreground">
                    Próximo: {new Date(paymentStats.nextPayment.due_date).toLocaleDateString('pt-BR')}
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            whileHover={{ scale: 1.05 }}
          >
            <Card className="relative overflow-hidden border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-secondary/10 hover:shadow-lg hover:shadow-primary/20 transition-all group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl" />
              <CardHeader className="pb-2 relative z-10">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-primary" />
                  Total Pago
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-1">
                  {formatCurrency(paymentStats?.totalPaid || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {payments.filter((p) => p.status === 'paid').length} pagamento(s)
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, type: 'spring' }}
            whileHover={{ scale: 1.05 }}
          >
            <Card className="relative overflow-hidden border-2 border-yellow-500/30 bg-gradient-to-br from-yellow-500/10 to-amber-500/5 hover:shadow-lg hover:shadow-yellow-500/20 transition-all group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 rounded-full blur-2xl" />
              <CardHeader className="pb-2 relative z-10">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Clock className="w-4 h-4 text-yellow-500" />
                  Pendente
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold text-yellow-500 mb-1">
                  {formatCurrency(paymentStats?.totalPending || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {payments.filter((p) => p.status === 'pending').length} pagamento(s)
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, type: 'spring' }}
            whileHover={{ scale: 1.05 }}
          >
            <Card className="relative overflow-hidden border-2 border-accent/30 bg-gradient-to-br from-accent/10 to-emerald-500/5 hover:shadow-lg hover:shadow-accent/20 transition-all group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-full blur-2xl" />
              <CardHeader className="pb-2 relative z-10">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Target className="w-4 h-4 text-accent" />
                  Progresso do Projeto
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold text-accent mb-2">
                  {projectStatus?.progress_percentage || 0}%
                </div>
                <Progress value={projectStatus?.progress_percentage || 0} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  {projectStatus?.phase || 'Iniciando'}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Gráficos */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Gráfico de Pagamentos */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="border-2 border-primary/20 hover:border-primary/40 transition-all">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  Histórico de Pagamentos
                </CardTitle>
              </CardHeader>
              <CardContent>
                {payments.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={preparePaymentChartData()}>
                      <defs>
                        <linearGradient id="colorPaid" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorPending" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#eab308" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#eab308" stopOpacity={0} />
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
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="pago"
                        stroke="#22c55e"
                        fillOpacity={1}
                        fill="url(#colorPaid)"
                        name="Pago"
                      />
                      <Area
                        type="monotone"
                        dataKey="pendente"
                        stroke="#eab308"
                        fillOpacity={1}
                        fill="url(#colorPending)"
                        name="Pendente"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    Nenhum pagamento registrado ainda
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Gráfico de Pizza - Status */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="border-2 border-secondary/20 hover:border-secondary/40 transition-all">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-secondary" />
                  Distribuição de Pagamentos
                </CardTitle>
              </CardHeader>
              <CardContent>
                {payments.length > 0 ? (
                  <div className="grid md:grid-cols-2 gap-6 items-center">
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={paymentStatusData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {paymentStatusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-3">
                      {paymentStatusData.map((item, index) => (
                        <div key={item.name} className="flex items-center gap-3">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: COLORS[index] }}
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-sm">{item.name}</span>
                              <span className="text-sm text-muted-foreground">{item.value}</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2 mt-1">
                              <div
                                className="h-2 rounded-full transition-all"
                                style={{
                                  width: `${payments.length > 0 ? (item.value / payments.length) * 100 : 0}%`,
                                  backgroundColor: COLORS[index],
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    Nenhum pagamento registrado ainda
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7, type: 'spring' }}
            whileHover={{ scale: 1.02 }}
          >
            <Card
              className="cursor-pointer hover:border-primary/40 transition-all border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 hover:shadow-lg"
              onClick={() => navigate('/dashboard/payments')}
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-primary" />
                    Pagamentos
                  </span>
                  <ArrowRight className="w-4 h-4 text-primary" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm mb-2">Gerencie seus pagamentos</p>
                {paymentStats?.nextPayment && (
                  <div className="mt-2 p-2 rounded-lg bg-primary/10">
                    <p className="text-xs text-muted-foreground">Próximo pagamento</p>
                    <p className="font-semibold text-foreground">
                      {formatCurrency(paymentStats.nextPayment.amount)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(paymentStats.nextPayment.due_date).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8, type: 'spring' }}
            whileHover={{ scale: 1.02 }}
          >
            <Card
              className="cursor-pointer hover:border-secondary/40 transition-all border-2 border-secondary/20 bg-gradient-to-br from-secondary/5 to-secondary/10 hover:shadow-lg"
              onClick={() => navigate('/dashboard/profile')}
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <User className="w-5 h-5 text-secondary" />
                    Perfil
                  </span>
                  <ArrowRight className="w-4 h-4 text-secondary" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">Atualizar informações pessoais</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.9, type: 'spring' }}
            whileHover={{ scale: 1.02 }}
          >
            <Card
              className="cursor-pointer hover:border-accent/40 transition-all border-2 border-accent/20 bg-gradient-to-br from-accent/5 to-accent/10 hover:shadow-lg"
              onClick={() => navigate('/dashboard/project')}
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-accent" />
                    Andamento
                  </span>
                  <ArrowRight className="w-4 h-4 text-accent" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm mb-2">Acompanhar progresso do projeto</p>
                {projectStatus && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground">Progresso</span>
                      <span className="text-xs font-semibold text-accent">
                        {projectStatus.progress_percentage}%
                      </span>
                    </div>
                    <Progress value={projectStatus.progress_percentage} className="h-2" />
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Termo de Aceite */}
        {termAcceptance && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
          >
            <Card className={termAcceptance.accepted ? 'border-green-500/30 bg-green-500/5' : 'border-yellow-500/30 bg-yellow-500/5'}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Termo de Aceite e Condições de Uso
                </CardTitle>
              </CardHeader>
              <CardContent>
                {termAcceptance.accepted && termAcceptance.acceptance ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                      <span className="font-medium text-green-700 dark:text-green-400">
                        Termo aceito em {new Date(termAcceptance.acceptance.accepted_at).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    {termAcceptance.term && (
                      <p className="text-sm text-muted-foreground">
                        Versão: {termAcceptance.term.version}
                      </p>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowTermsModal(true)}
                      className="mt-2"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Visualizar Termo
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-yellow-500" />
                      <span className="font-medium text-yellow-700 dark:text-yellow-400">
                        Você ainda não aceitou o termo de aceite
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowTermsModal(true)}
                      className="mt-2"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Ler e Aceitar Termo
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        <TermsModal
          open={showTermsModal}
          onOpenChange={setShowTermsModal}
          readOnly={termAcceptance?.accepted === true}
        />

        {/* Main Content */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Stats Cards */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Total de Usuários</CardTitle>
                  <Users className="w-8 h-8 text-primary" />
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-foreground">
                    {stats.totalUsers}
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Total de Contatos</CardTitle>
                  <Mail className="w-8 h-8 text-secondary" />
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-foreground">
                    {stats.totalContacts}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Recent Contacts */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Contatos Recentes</CardTitle>
              </CardHeader>
              <CardContent>
                {recentContacts.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhum contato ainda
                  </p>
                ) : (
                  <div className="space-y-4">
                    {recentContacts.map((contact) => (
                      <div
                        key={contact.id}
                        className="p-4 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-foreground mb-1">
                              {contact.name}
                            </h3>
                            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4" />
                                {contact.email}
                              </div>
                              {contact.phone && (
                                <div className="flex items-center gap-2">
                                  <Phone className="w-4 h-4" />
                                  {contact.phone}
                                </div>
                              )}
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                {new Date(contact.created_at).toLocaleDateString(
                                  'pt-BR'
                                )}
                              </div>
                            </div>
                            {contact.message && (
                              <div className="mt-2 flex items-start gap-2">
                                <MessageSquare className="w-4 h-4 text-muted-foreground mt-0.5" />
                                <p className="text-sm text-muted-foreground">
                                  {contact.message}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;

