import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Wallet,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  DollarSign,
  TrendingUp,
  FileText,
  Sparkles,
  QrCode,
  Receipt,
  Copy,
  ExternalLink,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { paymentsApi, Payment, ciabraApi } from '@/lib/api';
import { DashboardLayout } from '@/components/DashboardLayout';
import { PaymentCalendar } from '@/components/PaymentCalendar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const Payments = () => {
  const { toast } = useToast();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [paymentData, setPaymentData] = useState({
    payment_method: '',
    transaction_id: '',
    notes: '',
  });
  const [creatingCharge, setCreatingCharge] = useState<number | null>(null);
  const [showPixDialog, setShowPixDialog] = useState(false);
  const [showBoletoDialog, setShowBoletoDialog] = useState(false);
  const [pixQrCode, setPixQrCode] = useState<string>('');
  const [pixQrCodeUrl, setPixQrCodeUrl] = useState<string>('');
  const [boletoUrl, setBoletoUrl] = useState<string>('');
  const [paymentUrl, setPaymentUrl] = useState<string>(''); // URL do Ciabra para redirecionar

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [paymentsData, statsData] = await Promise.all([
        paymentsApi.getPayments(),
        paymentsApi.getStats(),
      ]);

      setPayments(paymentsData.payments);
      setStats(statsData.stats);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao carregar dados de pagamento',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsPaid = async () => {
    if (!selectedPayment) return;

    try {
      await paymentsApi.markAsPaid(selectedPayment.id, paymentData);
      toast({
        title: 'Sucesso!',
        description: 'Pagamento marcado como pago',
      });
      setIsDialogOpen(false);
      setPaymentData({ payment_method: '', transaction_id: '', notes: '' });
      loadData();
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao marcar pagamento',
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

  const handleCreateCharge = async (paymentId: number | null, method: 'pix' | 'boleto') => {
    try {
      // Usar -1 como identificador quando paymentId é null
      const chargeId = paymentId || -1;
      setCreatingCharge(chargeId);
      const response = await ciabraApi.createCharge(paymentId, method);
      
      // Verificar se é uma resposta parcial (erro 500 mas invoice pode ter sido criada)
      if (response.partial) {
        toast({
          title: 'Atenção',
          description: response.warning || 'A cobrança pode ter sido criada, mas os dados não estão disponíveis ainda. Aguarde o webhook ou verifique no painel do Ciabra.',
          variant: 'default',
        });
        loadData();
        return;
      }
      
      // Extrair dados da resposta
      const payment = response.payment || {};
      const pixCode = payment.ciabra_pix_qr_code || '';
      const pixUrl = payment.ciabra_pix_qr_code_url || '';
      const boleto = payment.ciabra_boleto_url || '';
      const paymentPageUrl = payment.payment_url || '';
      
      if (method === 'pix') {
        if (pixCode) {
          setPixQrCode(pixCode);
          setPixQrCodeUrl(pixUrl);
          setPaymentUrl(paymentPageUrl);
          setShowPixDialog(true);
        } else if (paymentPageUrl) {
          // Se não tiver QR code mas tiver URL, redirecionar
          window.open(paymentPageUrl, '_blank');
          toast({
            title: 'Redirecionando...',
            description: 'Abrindo página de pagamento PIX',
          });
        }
      } else if (method === 'boleto') {
        if (boleto) {
          setBoletoUrl(boleto);
          setPaymentUrl(paymentPageUrl);
          setShowBoletoDialog(true);
        } else if (paymentPageUrl) {
          // Se não tiver URL do boleto mas tiver URL de pagamento, redirecionar
          window.open(paymentPageUrl, '_blank');
          toast({
            title: 'Redirecionando...',
            description: 'Abrindo página de pagamento do Boleto',
          });
        }
      }

      toast({
        title: 'Sucesso!',
        description: `Cobrança ${method === 'pix' ? 'PIX' : 'Boleto'} criada com sucesso`,
      });

      loadData();
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao criar cobrança',
        variant: 'destructive',
      });
    } finally {
      setCreatingCharge(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copiado!',
      description: 'Código PIX copiado para a área de transferência',
    });
  };

  const getStatusBadge = (payment: Payment) => {
    const today = new Date();
    const dueDate = new Date(payment.due_date);
    const isOverdue = dueDate < today && payment.status === 'pending';

    if (payment.status === 'paid') {
      return (
        <Badge className="bg-green-500 hover:bg-green-600">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Pago
        </Badge>
      );
    }

    if (isOverdue) {
      return (
        <Badge variant="destructive">
          <AlertCircle className="w-3 h-3 mr-1" />
          Em Atraso
        </Badge>
      );
    }

    return (
      <Badge variant="outline">
        <Clock className="w-3 h-3 mr-1" />
        Pendente
      </Badge>
    );
  };

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
        {/* Header */}
        <div>
          <h2 className="text-3xl font-bold text-foreground mb-2">Pagamentos</h2>
          <p className="text-muted-foreground">
            Acompanhe seus pagamentos e mantenha-se adimplente
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, type: 'spring' }}
            whileHover={{ scale: 1.05 }}
          >
            <Card className={`relative overflow-hidden border-2 transition-all group ${
              stats?.isAdimplente 
                ? 'border-green-500/30 bg-gradient-to-br from-green-500/10 to-emerald-500/5 hover:shadow-lg hover:shadow-green-500/20' 
                : 'border-red-500/30 bg-gradient-to-br from-red-500/10 to-rose-500/5 hover:shadow-lg hover:shadow-red-500/20'
            }`}>
              <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl ${
                stats?.isAdimplente ? 'bg-green-500/10' : 'bg-red-500/10'
              }`} />
              <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Status
                </CardTitle>
                {stats?.isAdimplente ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-500" />
                )}
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold">
                  {stats?.isAdimplente ? (
                    <span className="text-green-500">Adimplente</span>
                  ) : (
                    <span className="text-red-500">Inadimplente</span>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Pago
                </CardTitle>
                <DollarSign className="w-5 h-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(stats?.totalPaid || 0)}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Pendente
                </CardTitle>
                <Clock className="w-5 h-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(stats?.totalPending || 0)}
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
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Em Atraso
                </CardTitle>
                <AlertCircle className="w-5 h-5 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-500">
                  {formatCurrency(stats?.totalOverdue || 0)}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Calendário de Pagamentos */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <PaymentCalendar
            payments={payments}
            nextPayment={stats?.nextPayment || null}
            onDateClick={(date) => {
              const dayPayments = payments.filter((p) => {
                const paymentDate = new Date(p.due_date);
                return paymentDate.toDateString() === date.toDateString();
              });
              // Verificar se é o próximo pagamento
              if (stats?.nextPayment) {
                const nextPaymentDate = new Date(stats.nextPayment.due_date);
                if (nextPaymentDate.toDateString() === date.toDateString()) {
                  dayPayments.push(stats.nextPayment);
                }
              }
              if (dayPayments.length > 0) {
                toast({
                  title: `Pagamentos em ${date.toLocaleDateString('pt-BR')}`,
                  description: `${dayPayments.length} pagamento(s) encontrado(s)`,
                });
              }
            }}
          />
        </motion.div>

        {/* Next Payment */}
        {stats?.nextPayment && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6, type: 'spring' }}
          >
            <Card className="relative overflow-hidden border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-secondary/10 hover:shadow-lg hover:shadow-primary/20 transition-all">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
              <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 rounded-full blur-3xl" />
              <CardHeader className="relative z-10">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Próximo Pagamento
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-1">
                      {formatCurrency(stats.nextPayment.amount)}
                    </p>
                    <p className="text-muted-foreground flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Vencimento: {formatDate(stats.nextPayment.due_date)}
                    </p>
                    {!stats.nextPayment.id && (
                      <p className="text-xs text-muted-foreground mt-1 italic">
                        * Pagamento será criado ao gerar a cobrança
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {!stats.nextPayment.ciabra_charge_id ? (
                      <>
                        <Button
                          onClick={() => handleCreateCharge(stats.nextPayment.id || null, 'pix')}
                          disabled={creatingCharge === (stats.nextPayment.id || -1)}
                        >
                          {creatingCharge === (stats.nextPayment.id || -1) ? (
                            'Gerando...'
                          ) : (
                            <>
                              <QrCode className="w-4 h-4 mr-1" />
                              Pagar com PIX
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleCreateCharge(stats.nextPayment.id || null, 'boleto')}
                          disabled={creatingCharge === (stats.nextPayment.id || -1)}
                        >
                          {creatingCharge === (stats.nextPayment.id || -1) ? (
                            'Gerando...'
                          ) : (
                            <>
                              <Receipt className="w-4 h-4 mr-1" />
                              Gerar Boleto
                            </>
                          )}
                        </Button>
                      </>
                    ) : (
                        <>
                          {(stats.nextPayment.ciabra_pix_qr_code || stats.nextPayment.ciabra_payment_url) && (
                            <Button
                              onClick={() => {
                                if (stats.nextPayment.ciabra_pix_qr_code) {
                                  setPixQrCode(stats.nextPayment.ciabra_pix_qr_code);
                                  setPixQrCodeUrl(stats.nextPayment.ciabra_pix_qr_code_url || '');
                                  setPaymentUrl(stats.nextPayment.ciabra_payment_url || '');
                                  setShowPixDialog(true);
                                } else if (stats.nextPayment.ciabra_payment_url) {
                                  window.open(stats.nextPayment.ciabra_payment_url, '_blank');
                                } else if (stats.nextPayment.ciabra_pix_qr_code_url) {
                                  window.open(stats.nextPayment.ciabra_pix_qr_code_url, '_blank');
                                }
                              }}
                            >
                              <QrCode className="w-4 h-4 mr-1" />
                              Ver PIX
                            </Button>
                          )}
                          {stats.nextPayment.ciabra_boleto_url && (
                            <Button
                              variant="outline"
                              onClick={() => window.open(stats.nextPayment.ciabra_boleto_url, '_blank')}
                            >
                              <ExternalLink className="w-4 h-4 mr-1" />
                              Ver Boleto
                            </Button>
                          )}
                        </>
                      )}
                      {stats.nextPayment.id && stats.nextPayment.status === 'pending' && (
                        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              onClick={() => setSelectedPayment(stats.nextPayment)}
                            >
                              Marcar como Pago
                            </Button>
                          </DialogTrigger>
                        <DialogContent className="border-2 border-primary/20">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              <Sparkles className="w-5 h-5 text-primary" />
                              Confirmar Pagamento
                            </DialogTitle>
                            <DialogDescription>
                              Informe os detalhes do pagamento realizado
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div>
                              <Label>Método de Pagamento</Label>
                              <Input
                                placeholder="Ex: PIX, Boleto, Transferência"
                                value={paymentData.payment_method}
                                onChange={(e) =>
                                  setPaymentData({
                                    ...paymentData,
                                    payment_method: e.target.value,
                                  })
                                }
                              />
                            </div>
                            <div>
                              <Label>ID da Transação (opcional)</Label>
                              <Input
                                placeholder="Código da transação"
                                value={paymentData.transaction_id}
                                onChange={(e) =>
                                  setPaymentData({
                                    ...paymentData,
                                    transaction_id: e.target.value,
                                  })
                                }
                              />
                            </div>
                            <div>
                              <Label>Observações (opcional)</Label>
                              <Input
                                placeholder="Observações adicionais"
                                value={paymentData.notes}
                                onChange={(e) =>
                                  setPaymentData({
                                    ...paymentData,
                                    notes: e.target.value,
                                  })
                                }
                              />
                            </div>
                            <Button onClick={handleMarkAsPaid} className="w-full">
                              Confirmar Pagamento
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                      )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Payments List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Histórico de Pagamentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {payments.length === 0 ? (
              <div className="text-center py-12">
                <Wallet className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Nenhum pagamento registrado ainda
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-lg font-semibold text-foreground">
                          {formatCurrency(payment.amount)}
                        </span>
                        {getStatusBadge(payment)}
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Vencimento: {formatDate(payment.due_date)}
                        </span>
                        {payment.paid_date && (
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" />
                            Pago em: {formatDate(payment.paid_date)}
                          </span>
                        )}
                        {payment.payment_method && (
                          <span>Método: {payment.payment_method}</span>
                        )}
                      </div>
                      {payment.notes && (
                        <p className="text-sm text-muted-foreground mt-2">
                          {payment.notes}
                        </p>
                      )}
                    </div>
                    {payment.status === 'pending' && (
                      <div className="flex gap-2">
                        {!payment.ciabra_charge_id ? (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCreateCharge(payment.id, 'pix')}
                              disabled={creatingCharge === payment.id}
                            >
                              {creatingCharge === payment.id ? (
                                'Gerando...'
                              ) : (
                                <>
                                  <QrCode className="w-4 h-4 mr-1" />
                                  PIX
                                </>
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCreateCharge(payment.id, 'boleto')}
                              disabled={creatingCharge === payment.id}
                            >
                              {creatingCharge === payment.id ? (
                                'Gerando...'
                              ) : (
                                <>
                                  <Receipt className="w-4 h-4 mr-1" />
                                  Boleto
                                </>
                              )}
                            </Button>
                          </>
                        ) : (
                          <>
                            {(payment.ciabra_pix_qr_code || payment.ciabra_payment_url || payment.ciabra_pix_qr_code_url) && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  if (payment.ciabra_pix_qr_code) {
                                    setPixQrCode(payment.ciabra_pix_qr_code);
                                    setPixQrCodeUrl(payment.ciabra_pix_qr_code_url || '');
                                    setPaymentUrl(payment.ciabra_payment_url || '');
                                    setShowPixDialog(true);
                                  } else if (payment.ciabra_payment_url) {
                                    window.open(payment.ciabra_payment_url, '_blank');
                                  } else if (payment.ciabra_pix_qr_code_url) {
                                    window.open(payment.ciabra_pix_qr_code_url, '_blank');
                                  }
                                }}
                              >
                                <QrCode className="w-4 h-4 mr-1" />
                                Ver PIX
                              </Button>
                            )}
                            {payment.ciabra_boleto_url && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(payment.ciabra_boleto_url, '_blank')}
                              >
                                <ExternalLink className="w-4 h-4 mr-1" />
                                Boleto
                              </Button>
                            )}
                          </>
                        )}
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedPayment(payment)}
                            >
                              Marcar como Pago
                            </Button>
                          </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Confirmar Pagamento</DialogTitle>
                            <DialogDescription>
                              Informe os detalhes do pagamento realizado
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div>
                              <Label>Método de Pagamento</Label>
                              <Input
                                placeholder="Ex: PIX, Boleto, Transferência"
                                value={paymentData.payment_method}
                                onChange={(e) =>
                                  setPaymentData({
                                    ...paymentData,
                                    payment_method: e.target.value,
                                  })
                                }
                              />
                            </div>
                            <div>
                              <Label>ID da Transação (opcional)</Label>
                              <Input
                                placeholder="Código da transação"
                                value={paymentData.transaction_id}
                                onChange={(e) =>
                                  setPaymentData({
                                    ...paymentData,
                                    transaction_id: e.target.value,
                                  })
                                }
                              />
                            </div>
                            <div>
                              <Label>Observações (opcional)</Label>
                              <Input
                                placeholder="Observações adicionais"
                                value={paymentData.notes}
                                onChange={(e) =>
                                  setPaymentData({
                                    ...paymentData,
                                    notes: e.target.value,
                                  })
                                }
                              />
                            </div>
                            <Button
                              onClick={() => {
                                setSelectedPayment(payment);
                                handleMarkAsPaid();
                              }}
                              className="w-full"
                            >
                              Confirmar Pagamento
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* PIX QR Code Dialog */}
        <Dialog open={showPixDialog} onOpenChange={setShowPixDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <QrCode className="w-5 h-5" />
                Pagamento via PIX
              </DialogTitle>
              <DialogDescription>
                Escaneie o QR Code ou copie o código para pagar
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {pixQrCode && (
                <>
                  <div className="flex justify-center p-4 bg-white rounded-lg border-2 border-dashed border-primary/20">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(pixQrCode)}`}
                      alt="QR Code PIX"
                      className="w-64 h-64"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Código PIX (Copiar e Colar)</Label>
                    <div className="flex gap-2">
                      <Input
                        value={pixQrCode}
                        readOnly
                        className="font-mono text-xs"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => copyToClipboard(pixQrCode)}
                        title="Copiar código PIX"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  {paymentUrl && (
                    <div className="pt-2 border-t">
                      <Button
                        className="w-full"
                        onClick={() => window.open(paymentUrl, '_blank')}
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Pagar na página do Ciabra
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Boleto Dialog */}
        <Dialog open={showBoletoDialog} onOpenChange={setShowBoletoDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Receipt className="w-5 h-5" />
                Pagamento via Boleto
              </DialogTitle>
              <DialogDescription>
                Visualize ou baixe o boleto para pagamento
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {boletoUrl && (
                <>
                  <div className="space-y-2">
                    <Label>URL do Boleto</Label>
                    <div className="flex gap-2">
                      <Input
                        value={boletoUrl}
                        readOnly
                        className="font-mono text-xs"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => copyToClipboard(boletoUrl)}
                        title="Copiar URL do boleto"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button
                      className="w-full"
                      onClick={() => window.open(boletoUrl, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Abrir Boleto em Nova Aba
                    </Button>
                    {paymentUrl && (
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => window.open(paymentUrl, '_blank')}
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Pagar na página do Ciabra
                      </Button>
                    )}
                  </div>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Payments;

