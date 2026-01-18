import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, ChevronLeft, ChevronRight, DollarSign, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';

interface Payment {
  id: number;
  due_date: string;
  paid_date?: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
}

interface PaymentCalendarProps {
  payments: Payment[];
  onDateClick?: (date: Date) => void;
}

export const PaymentCalendar = ({ payments, onDateClick }: PaymentCalendarProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getPaymentsForDate = (date: Date) => {
    return payments.filter((payment) => {
      const paymentDate = new Date(payment.due_date);
      return isSameDay(paymentDate, date);
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-500 text-white';
      case 'overdue':
        return 'bg-red-500 text-white';
      case 'pending':
        return 'bg-yellow-500 text-white';
      default:
        return 'bg-gray-200 text-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle2 className="w-3 h-3" />;
      case 'overdue':
        return <AlertCircle className="w-3 h-3" />;
      case 'pending':
        return <Clock className="w-3 h-3" />;
      default:
        return null;
    }
  };

  const previousMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return (
    <Card className="border-2 border-primary/20 hover:border-primary/40 transition-all">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Calendário de Pagamentos
          </CardTitle>
          <div className="flex items-center gap-2">
            <button
              onClick={previousMonth}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-semibold min-w-[150px] text-center capitalize">
              {format(currentDate, 'MMMM yyyy')}
            </span>
            <button
              onClick={nextMonth}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-2 mb-4">
          {weekDays.map((day) => (
            <div key={day} className="text-center text-sm font-semibold text-muted-foreground py-2">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {daysInMonth.map((day, index) => {
            const dayPayments = getPaymentsForDate(day);
            const isToday = isSameDay(day, new Date());
            const isCurrentMonth = isSameMonth(day, currentDate);

            return (
              <motion.button
                key={day.toISOString()}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.01 }}
                onClick={() => onDateClick?.(day)}
                className={`
                  relative p-2 rounded-lg border-2 transition-all min-h-[80px]
                  ${isCurrentMonth ? 'border-border hover:border-primary' : 'border-transparent opacity-40'}
                  ${isToday ? 'bg-primary/10 border-primary' : 'bg-card'}
                  ${dayPayments.length > 0 ? 'hover:shadow-lg cursor-pointer' : ''}
                `}
              >
                <div className="text-sm font-medium mb-1">
                  {format(day, 'd')}
                </div>
                {dayPayments.length > 0 && (
                  <div className="space-y-1">
                    {dayPayments.slice(0, 2).map((payment) => (
                      <Badge
                        key={payment.id}
                        className={`${getStatusColor(payment.status)} text-xs flex items-center gap-1 w-full justify-center`}
                      >
                        {getStatusIcon(payment.status)}
                        {formatCurrency(payment.amount)}
                      </Badge>
                    ))}
                    {dayPayments.length > 2 && (
                      <div className="text-xs text-muted-foreground text-center">
                        +{dayPayments.length - 2}
                      </div>
                    )}
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>
        <div className="mt-6 flex flex-wrap gap-4 justify-center">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-green-500" />
            <span className="text-sm">Pago</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-yellow-500" />
            <span className="text-sm">Pendente</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-red-500" />
            <span className="text-sm">Em Atraso</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

