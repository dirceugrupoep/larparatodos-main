import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Download,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Phone,
  Mail,
  Building2,
  TrendingUp,
  BarChart3,
  Users,
  FileSpreadsheet,
  LineChart as LineChartIcon,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { adminApi } from '@/lib/api';
import { AdminLayout } from '@/components/AdminLayout';

type ReportStatus = 'all' | 'paid' | 'pending' | 'overdue';

interface AdminAssociation {
  id: number;
  trade_name: string;
  corporate_name?: string;
}

interface AnalyticsDRE {
  receitaOperacional: number;
  parcelasPagasPeriodo: number;
  parcelasPendentes: number;
  valorPendente: number;
  parcelasAtrasadas: number;
  valorAtrasado: number;
  totalReceitaAcumulada: number;
  inadimplenciaTotal: number;
  cooperadosPagantes: number;
  cooperadosInadimplentes: number;
}

interface FaturamentoMes {
  mesAno: string;
  valor: number;
  quantidade: number;
}

interface AnalyticsData {
  dre: AnalyticsDRE;
  faturamentoPorMes: FaturamentoMes[];
  periodo: { startDate: string; endDate: string };
  associationId: number | null;
}

interface ForecastMonth {
  month: string;
  monthLabel: string;
  daysInMonth: number;
  predictedRevenue: number;
  predictedRegistrations: number;
}

interface ForecastData {
  projectionMonths: number;
  basedOnDays: number;
  avgDailyRevenue: number;
  avgDailyRegistrations: number;
  byMonth: ForecastMonth[];
  totalPredictedRevenue: number;
  totalPredictedRegistrations: number;
}

const AdminReportsPage = () => {
  const { toast } = useToast();
  const [associations, setAssociations] = useState<AdminAssociation[]>([]);
  const [paymentsReport, setPaymentsReport] = useState<any[]>([]);
  const [overdueReport, setOverdueReport] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [startDate, setStartDate] = useState(
    new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [associationId, setAssociationId] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<ReportStatus>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [forecastMonths, setForecastMonths] = useState<string>('6');
  const [forecastData, setForecastData] = useState<ForecastData | null>(null);
  const [isLoadingForecast, setIsLoadingForecast] = useState(false);

  useEffect(() => {
    loadAssociations();
  }, []);

  const loadAssociations = async () => {
    try {
      const { associations: list } = await adminApi.getAssociations();
      setAssociations(list || []);
    } catch {
      setAssociations([]);
    }
  };

  const loadAllReports = async () => {
    try {
      setIsLoading(true);
      const assocId = associationId && associationId !== 'all' ? parseInt(associationId, 10) : null;
      const [paymentsData, analyticsData, overdueData] = await Promise.all([
        adminApi.getPaymentsReport({
          startDate,
          endDate,
          associationId: assocId,
          status: statusFilter,
        }),
        adminApi.getReportsAnalytics({
          startDate,
          endDate,
          associationId: assocId,
        }),
        adminApi.getOverdueReport(assocId),
      ]);
      setPaymentsReport(paymentsData.payments || []);
      setAnalytics(analyticsData);
      setOverdueReport(overdueData.overdueUsers || []);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao gerar relatórios',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadForecast = async () => {
    try {
      setIsLoadingForecast(true);
      const months = parseInt(forecastMonths, 10) || 6;
      const data = await adminApi.getForecastReport(months);
      setForecastData(data);
    } catch {
      toast({
        title: 'Erro',
        description: 'Erro ao gerar previsão',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingForecast(false);
    }
  };

  const loadOverdueReport = async () => {
    try {
      const assocId = associationId && associationId !== 'all' ? parseInt(associationId, 10) : null;
      const data = await adminApi.getOverdueReport(assocId);
      setOverdueReport(data.overdueUsers || []);
    } catch {
      toast({
        title: 'Erro',
        description: 'Erro ao carregar relatório de inadimplência',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    loadOverdueReport();
  }, [associationId]); // eslint-disable-line react-hooks/exhaustive-deps -- recarrega inadimplência ao trocar associação

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatMesAno = (mesAno: string) => {
    const [y, m] = mesAno.split('-');
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return `${monthNames[parseInt(m, 10) - 1]}/${y}`;
  };

  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) {
      toast({
        title: 'Erro',
        description: 'Nenhum dado para exportar',
        variant: 'destructive',
      });
      return;
    }
    const headers = Object.keys(data[0]);
    const csv = [
      headers.join(','),
      ...data.map((row) =>
        headers.map((header) => {
          const value = row[header];
          return typeof value === 'string' ? `"${value}"` : value;
        }).join(',')
      ),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast({ title: 'Sucesso!', description: 'Relatório exportado com sucesso' });
  };

  const showAssociationColumn = associationId === 'all' || !associationId;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-foreground mb-2">Relatórios</h2>
          <p className="text-muted-foreground">
            Gere e exporte relatórios gerenciais com filtros e visão analítica (DRE e faturamento)
          </p>
        </div>

        {/* Filtros e Relatório de Pagamentos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between flex-wrap gap-2">
              <span className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Relatório de Pagamentos
              </span>
              {paymentsReport.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportToCSV(paymentsReport, 'pagamentos')}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Exportar CSV
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <Label>Data Inicial</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <Label>Data Final</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <div>
                <Label>Associação</Label>
                <Select value={associationId} onValueChange={setAssociationId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {associations.map((a) => (
                      <SelectItem key={a.id} value={String(a.id)}>
                        {a.trade_name || a.corporate_name || `Associação ${a.id}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as ReportStatus)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="paid">Pagantes (parcelas pagas)</SelectItem>
                    <SelectItem value="pending">Pendentes</SelectItem>
                    <SelectItem value="overdue">Inadimplentes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button onClick={loadAllReports} className="w-full" disabled={isLoading}>
                  {isLoading ? 'Carregando...' : 'Gerar Relatório'}
                </Button>
              </div>
            </div>

            {paymentsReport.length > 0 && (
              <div className="mt-6 space-y-2">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        {showAssociationColumn && (
                          <th className="text-left p-2">Associação</th>
                        )}
                        <th className="text-left p-2">Data</th>
                        <th className="text-left p-2">Usuário</th>
                        <th className="text-left p-2">Email</th>
                        <th className="text-left p-2">CPF</th>
                        <th className="text-right p-2">Valor</th>
                        <th className="text-left p-2">Status</th>
                        <th className="text-left p-2">Vencimento</th>
                        <th className="text-left p-2">Pagamento</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paymentsReport.map((payment) => (
                        <tr key={payment.id} className="border-b hover:bg-muted/50">
                          {showAssociationColumn && (
                            <td className="p-2">{payment.association_name || '-'}</td>
                          )}
                          <td className="p-2">{formatDate(payment.created_at)}</td>
                          <td className="p-2">{payment.user_name}</td>
                          <td className="p-2">{payment.user_email}</td>
                          <td className="p-2">{payment.user_cpf || '-'}</td>
                          <td className="p-2 text-right">{formatCurrency(parseFloat(payment.amount))}</td>
                          <td className="p-2">
                            <Badge
                              variant={
                                payment.status === 'paid'
                                  ? 'default'
                                  : payment.status === 'pending' &&
                                    new Date(payment.due_date) < new Date()
                                  ? 'destructive'
                                  : 'outline'
                              }
                            >
                              {payment.status === 'paid'
                                ? 'Pago'
                                : payment.status === 'pending' &&
                                  new Date(payment.due_date) < new Date()
                                ? 'Em Atraso'
                                : 'Pendente'}
                            </Badge>
                          </td>
                          <td className="p-2">{formatDate(payment.due_date)}</td>
                          <td className="p-2">
                            {payment.paid_date ? formatDate(payment.paid_date) : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Visão gerencial: DRE e Faturamento do mês */}
        {analytics && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <h3 className="text-xl font-semibold text-foreground flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5" />
              Visão gerencial (DRE e faturamento)
            </h3>

            <div className="grid md:grid-cols-2 gap-4">
              {/* DRE - Demonstrativo de Resultado */}
              <Card className="border-2 border-primary/20">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    DRE (Demonstrativo de Resultado)
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Período: {formatDate(analytics.periodo.startDate)} a {formatDate(analytics.periodo.endDate)}
                    {analytics.associationId && associations.find((a) => a.id === analytics.associationId) && (
                      <> • {associations.find((a) => a.id === analytics.associationId)?.trade_name}</>
                    )}
                  </p>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-muted-foreground">Receita no período (parcelas pagas)</span>
                    <span className="font-semibold text-green-600">
                      {formatCurrency(analytics.dre.receitaOperacional)}
                    </span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-muted-foreground">Parcelas pagas no período</span>
                    <span>{analytics.dre.parcelasPagasPeriodo}</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-muted-foreground">Total receita acumulada</span>
                    <span className="font-medium">{formatCurrency(analytics.dre.totalReceitaAcumulada)}</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-muted-foreground">Pendentes (a vencer)</span>
                    <span>{analytics.dre.parcelasPendentes} • {formatCurrency(analytics.dre.valorPendente)}</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-muted-foreground">Atrasadas (inadimplência)</span>
                    <span className="text-red-600 font-medium">
                      {analytics.dre.parcelasAtrasadas} • {formatCurrency(analytics.dre.valorAtrasado)}
                    </span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-muted-foreground">Inadimplência total</span>
                    <span className="font-semibold text-red-600">
                      {formatCurrency(analytics.dre.inadimplenciaTotal)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Users className="w-4 h-4" /> Cooperados pagantes / inadimplentes
                    </span>
                    <span>
                      <span className="text-green-600">{analytics.dre.cooperadosPagantes}</span>
                      {' / '}
                      <span className="text-red-600">{analytics.dre.cooperadosInadimplentes}</span>
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Faturamento por mês */}
              <Card className="border-2 border-primary/20">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Faturamento por mês
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Últimos 12 meses (parcelas efetivamente pagas)
                  </p>
                </CardHeader>
                <CardContent>
                  {analytics.faturamentoPorMes.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhum faturamento no período.</p>
                  ) : (
                    <div className="space-y-2 max-h-[320px] overflow-y-auto">
                      {analytics.faturamentoPorMes.map((mes) => (
                        <div
                          key={mes.mesAno}
                          className="flex justify-between items-center py-2 border-b last:border-0 text-sm"
                        >
                          <span className="font-medium">{formatMesAno(mes.mesAno)}</span>
                          <span className="text-green-600 font-semibold">
                            {formatCurrency(mes.valor)}
                          </span>
                          <span className="text-muted-foreground">({mes.quantidade} parc.)</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </motion.div>
        )}

        {/* Relatório de previsão */}
        <Card className="border-2 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LineChartIcon className="w-5 h-5" />
              Relatório de previsão
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Escolha a quantidade de meses e veja a previsão de receita e de novos cadastros com base na média dos últimos 90 dias.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-end gap-4">
              <div className="w-40">
                <Label>Próximos meses</Label>
                <Select value={forecastMonths} onValueChange={setForecastMonths}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 meses</SelectItem>
                    <SelectItem value="6">6 meses</SelectItem>
                    <SelectItem value="12">12 meses</SelectItem>
                    <SelectItem value="24">24 meses</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={loadForecast} disabled={isLoadingForecast}>
                {isLoadingForecast ? 'Gerando...' : 'Gerar previsão'}
              </Button>
            </div>

            {forecastData && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                    <p className="text-sm text-muted-foreground">Previsão total de receita</p>
                    <p className="text-2xl font-bold text-primary">
                      {formatCurrency(forecastData.totalPredictedRevenue)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Média diária base: {formatCurrency(forecastData.avgDailyRevenue)} × {forecastData.projectionMonths} meses
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <p className="text-sm text-muted-foreground">Previsão total de cadastros</p>
                    <p className="text-2xl font-bold text-emerald-600">
                      {forecastData.totalPredictedRegistrations.toLocaleString('pt-BR')}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Média diária base: {forecastData.avgDailyRegistrations.toFixed(1)} × {forecastData.projectionMonths} meses
                    </p>
                  </div>
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/50 border-b">
                        <th className="text-left p-3">Mês</th>
                        <th className="text-right p-3">Previsão receita</th>
                        <th className="text-right p-3">Previsão cadastros</th>
                      </tr>
                    </thead>
                    <tbody>
                      {forecastData.byMonth.map((row) => (
                        <tr key={row.month} className="border-b last:border-0 hover:bg-muted/30">
                          <td className="p-3 font-medium">{row.monthLabel}</td>
                          <td className="p-3 text-right text-green-600">
                            {formatCurrency(row.predictedRevenue)}
                          </td>
                          <td className="p-3 text-right">
                            {row.predictedRegistrations.toLocaleString('pt-BR')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-muted-foreground">
                  Baseado na média dos últimos {forecastData.basedOnDays} dias. Valores meramente indicativos.
                </p>
              </motion.div>
            )}
          </CardContent>
        </Card>

        {/* Relatório de Inadimplência */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between flex-wrap gap-2">
              <span className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                Relatório de Inadimplência
              </span>
              {overdueReport.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportToCSV(overdueReport, 'inadimplencia')}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Exportar CSV
                </Button>
              )}
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Filtrado por associação quando selecionada. Gere o relatório de pagamentos para atualizar.
            </p>
          </CardHeader>
          <CardContent>
            {overdueReport.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Nenhum usuário inadimplente encontrado. Todos estão em dia!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {overdueReport.map((user) => (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-lg border border-red-500/20 bg-red-500/5"
                  >
                    <div className="flex items-start justify-between flex-wrap gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <h3 className="font-semibold text-foreground">{user.name}</h3>
                          <Badge variant="destructive">
                            {user.overdue_count} pagamento(s) em atraso
                          </Badge>
                          {user.association_name && (
                            <Badge variant="outline" className="flex items-center gap-1">
                              <Building2 className="w-3 h-3" />
                              {user.association_name}
                            </Badge>
                          )}
                        </div>
                        <div className="grid md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 flex-shrink-0" />
                            {user.email}
                          </div>
                          {user.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4 flex-shrink-0" />
                              {user.phone}
                            </div>
                          )}
                          {user.cpf && <div>CPF: {user.cpf}</div>}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-red-500">
                          {formatCurrency(parseFloat(user.total_overdue))}
                        </div>
                        <p className="text-sm text-muted-foreground">Total em atraso</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminReportsPage;
