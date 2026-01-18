import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FileText,
  Download,
  Calendar,
  DollarSign,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  Filter,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { associationDashboardApi, AssociationReport } from '@/lib/api';
import { AssociationLayout } from '@/components/AssociationLayout';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
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

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6'];

const AssociationReports = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [report, setReport] = useState<AssociationReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [startDate, setStartDate] = useState(
    format(new Date(new Date().getFullYear(), 0, 1), 'yyyy-MM-dd')
  );
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  useEffect(() => {
    loadReport();
  }, [startDate, endDate]);

  const loadReport = async () => {
    try {
      setIsLoading(true);
      const data = await associationDashboardApi.getReports(startDate, endDate);
      setReport(data);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao carregar relatórios',
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

  const exportReport = () => {
    if (!report) return;

    const csv = [
      ['Relatório Financeiro', `Período: ${startDate} a ${endDate}`].join(','),
      [],
      ['Resumo Financeiro'].join(','),
      ['Pagamentos Recebidos', report.financial.paidCount].join(','),
      ['Pagamentos Pendentes', report.financial.pendingCount].join(','),
      ['Pagamentos Atrasados', report.financial.overdueCount].join(','),
      ['Total Recebido', formatCurrency(report.financial.totalReceived)].join(','),
      ['Total Pendente', formatCurrency(report.financial.totalPending)].join(','),
      ['Total Atrasado', formatCurrency(report.financial.totalOverdue)].join(','),
      [],
      ['Pagamentos'].join(','),
      ['ID', 'Usuário', 'Email', 'Valor', 'Vencimento', 'Pagamento', 'Status', 'Método'].join(','),
      ...report.payments.map((p) =>
        [
          p.id,
          p.user_name,
          p.user_email,
          p.amount,
          p.due_date,
          p.paid_date || '',
          p.status,
          p.payment_method || '',
        ].join(',')
      ),
      [],
      ['Usuários'].join(','),
      ['ID', 'Nome', 'Email', 'CPF', 'Status', 'Total Pago', 'Pagamentos'].join(','),
      ...report.users.map((u) =>
        [
          u.id,
          u.name,
          u.email,
          u.cpf || '',
          u.is_active ? 'Ativo' : 'Inativo',
          u.total_contributed,
          u.paid_payments,
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-${startDate}-${endDate}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: 'Sucesso',
      description: 'Relatório exportado com sucesso',
    });
  };

  if (isLoading) {
    return (
      <AssociationLayout>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Carregando relatórios...</p>
          </div>
        </div>
      </AssociationLayout>
    );
  }

  if (!report) {
    return null;
  }

  // Preparar dados para gráficos
  const paymentsByStatus = [
    { name: 'Recebidos', value: report.financial.paidCount, color: '#10b981' },
    { name: 'Pendentes', value: report.financial.pendingCount, color: '#f59e0b' },
    { name: 'Atrasados', value: report.financial.overdueCount, color: '#ef4444' },
  ];

  const revenueByStatus = [
    { name: 'Recebido', value: report.financial.totalReceived, color: '#10b981' },
    { name: 'Pendente', value: report.financial.totalPending, color: '#f59e0b' },
    { name: 'Atrasado', value: report.financial.totalOverdue, color: '#ef4444' },
  ];

  // Agrupar pagamentos por mês
  const paymentsByMonth = report.payments.reduce((acc, payment) => {
    const month = format(new Date(payment.due_date), 'yyyy-MM');
    if (!acc[month]) {
      acc[month] = { month, paid: 0, pending: 0, overdue: 0 };
    }
    if (payment.status === 'paid') {
      acc[month].paid += payment.amount;
    } else if (new Date(payment.due_date) < new Date() && payment.status === 'pending') {
      acc[month].overdue += payment.amount;
    } else {
      acc[month].pending += payment.amount;
    }
    return acc;
  }, {} as Record<string, { month: string; paid: number; pending: number; overdue: number }>);

  const paymentsByMonthData = Object.values(paymentsByMonth)
    .map((item) => ({
      month: format(new Date(item.month + '-01'), 'MMM', { locale: ptBR }),
      recebido: item.paid,
      pendente: item.pending,
      atrasado: item.overdue,
    }))
    .sort((a, b) => {
      const dateA = new Date(a.month);
      const dateB = new Date(b.month);
      return dateA.getTime() - dateB.getTime();
    });

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
            <h1 className="text-3xl font-bold text-foreground mb-2">Relatórios</h1>
            <p className="text-muted-foreground">
              Análise completa e detalhada da sua associação
            </p>
          </div>
          <Button onClick={exportReport}>
            <Download className="w-4 h-4 mr-2" />
            Exportar CSV
          </Button>
        </motion.div>

        {/* Filtros de Período */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filtrar por Período
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Data Inicial</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="endDate">Data Final</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Período: {format(new Date(startDate), "dd 'de' MMM 'de' yyyy", { locale: ptBR })} a{' '}
              {format(new Date(endDate), "dd 'de' MMM 'de' yyyy", { locale: ptBR })}
            </p>
          </CardContent>
        </Card>

        {/* Resumo Financeiro */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Recebido</p>
                  <p className="text-2xl font-bold text-green-500">
                    {formatCurrency(report.financial.totalReceived)}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-green-500/50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Pendente</p>
                  <p className="text-2xl font-bold text-yellow-500">
                    {formatCurrency(report.financial.totalPending)}
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
                  <p className="text-sm text-muted-foreground mb-1">Total Atrasado</p>
                  <p className="text-2xl font-bold text-red-500">
                    {formatCurrency(report.financial.totalOverdue)}
                  </p>
                </div>
                <AlertCircle className="w-8 h-8 text-red-500/50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total de Usuários</p>
                  <p className="text-2xl font-bold text-primary">{report.users.length}</p>
                </div>
                <Users className="w-8 h-8 text-primary/50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Pagamentos por Status */}
          <Card>
            <CardHeader>
              <CardTitle>Pagamentos por Status</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={paymentsByStatus}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {paymentsByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Receita por Status */}
          <Card>
            <CardHeader>
              <CardTitle>Receita por Status</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={revenueByStatus}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Bar dataKey="value" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Pagamentos por Mês */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Pagamentos por Mês</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={paymentsByMonthData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                  <Bar dataKey="recebido" stackId="a" fill="#10b981" name="Recebido" />
                  <Bar dataKey="pendente" stackId="a" fill="#f59e0b" name="Pendente" />
                  <Bar dataKey="atrasado" stackId="a" fill="#ef4444" name="Atrasado" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Estatísticas Detalhadas */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                Pagamentos Recebidos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-500 mb-2">
                {report.financial.paidCount}
              </p>
              <p className="text-sm text-muted-foreground">
                {formatCurrency(report.financial.totalReceived)} recebidos
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-yellow-500" />
                Pagamentos Pendentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-yellow-500 mb-2">
                {report.financial.pendingCount}
              </p>
              <p className="text-sm text-muted-foreground">
                {formatCurrency(report.financial.totalPending)} pendentes
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                Pagamentos Atrasados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-red-500 mb-2">
                {report.financial.overdueCount}
              </p>
              <p className="text-sm text-muted-foreground">
                {formatCurrency(report.financial.totalOverdue)} em atraso
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Pagamentos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Lista de Pagamentos ({report.payments.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Usuário</th>
                    <th className="text-left p-2">Valor</th>
                    <th className="text-left p-2">Vencimento</th>
                    <th className="text-left p-2">Pagamento</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-left p-2">Método</th>
                  </tr>
                </thead>
                <tbody>
                  {report.payments.slice(0, 50).map((payment) => (
                    <tr key={payment.id} className="border-b hover:bg-muted/50">
                      <td className="p-2">
                        <div>
                          <p className="font-medium">{payment.user_name}</p>
                          <p className="text-xs text-muted-foreground">{payment.user_email}</p>
                        </div>
                      </td>
                      <td className="p-2 font-medium">{formatCurrency(payment.amount)}</td>
                      <td className="p-2">
                        {format(new Date(payment.due_date), 'dd/MM/yyyy', { locale: ptBR })}
                      </td>
                      <td className="p-2">
                        {payment.paid_date
                          ? format(new Date(payment.paid_date), 'dd/MM/yyyy', { locale: ptBR })
                          : '-'}
                      </td>
                      <td className="p-2">
                        {payment.status === 'paid' ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Pago
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Pendente
                          </span>
                        )}
                      </td>
                      <td className="p-2 text-sm text-muted-foreground">
                        {payment.payment_method || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {report.payments.length > 50 && (
                <p className="text-sm text-muted-foreground mt-4 text-center">
                  Mostrando 50 de {report.payments.length} pagamentos. Exporte o relatório para ver todos.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AssociationLayout>
  );
};

export default AssociationReports;

