import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Download,
  Calendar,
  DollarSign,
  AlertCircle,
  User,
  CheckCircle2,
  Phone,
  Mail,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { adminApi } from '@/lib/api';
import { AdminLayout } from '@/components/AdminLayout';

const AdminReportsPage = () => {
  const { toast } = useToast();
  const [paymentsReport, setPaymentsReport] = useState<any[]>([]);
  const [overdueReport, setOverdueReport] = useState<any[]>([]);
  const [startDate, setStartDate] = useState(
    new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadOverdueReport();
  }, []);

  const loadPaymentsReport = async () => {
    try {
      setIsLoading(true);
      const data = await adminApi.getPaymentsReport(startDate, endDate);
      setPaymentsReport(data.payments);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao carregar relatório de pagamentos',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadOverdueReport = async () => {
    try {
      const data = await adminApi.getOverdueReport();
      setOverdueReport(data.overdueUsers);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao carregar relatório de inadimplência',
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

    toast({
      title: 'Sucesso!',
      description: 'Relatório exportado com sucesso',
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-3xl font-bold text-foreground mb-2">
            Relatórios
          </h2>
          <p className="text-muted-foreground">
            Gere e exporte relatórios do sistema
          </p>
        </div>

        {/* Relatório de Pagamentos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
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
            <div className="grid md:grid-cols-3 gap-4">
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
              <div className="flex items-end">
                <Button onClick={loadPaymentsReport} className="w-full" disabled={isLoading}>
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

        {/* Relatório de Inadimplência */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
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
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-foreground">{user.name}</h3>
                          <Badge variant="destructive">
                            {user.overdue_count} pagamento(s) em atraso
                          </Badge>
                        </div>
                        <div className="grid md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            {user.email}
                          </div>
                          {user.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4" />
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

