import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  CheckCircle2,
  Clock,
  Calendar,
  TrendingUp,
  Home,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { projectApi, ProjectStatus } from '@/lib/api';
import { DashboardLayout } from '@/components/DashboardLayout';

const phaseLabels: Record<string, string> = {
  registration: 'Cadastro',
  documentation: 'Documentação',
  planning: 'Planejamento',
  projects: 'Projetos',
  construction: 'Construção',
  delivery: 'Entrega',
};

const Project = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState<ProjectStatus | null>(null);
  const [timeline, setTimeline] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [statusData, timelineData] = await Promise.all([
        projectApi.getStatus(),
        projectApi.getTimeline(),
      ]);

      setStatus(statusData.status);
      setTimeline(timelineData.phases);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao carregar dados do projeto',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentPhaseIndex = () => {
    if (!status) return 0;
    return timeline.findIndex((phase) => phase.phase === status.phase);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR');
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

  const currentPhaseIndex = getCurrentPhaseIndex();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-3xl font-bold text-foreground mb-2">
            Andamento do Projeto
          </h2>
          <p className="text-muted-foreground">
            Acompanhe o progresso da sua casa
          </p>
        </div>

        {/* Status Card */}
        {status && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Status Atual
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-muted-foreground">
                      Fase Atual
                    </span>
                    <Badge variant="default">
                      {phaseLabels[status.phase] || status.phase}
                    </Badge>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${status.progress_percentage}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-xs text-muted-foreground">0%</span>
                    <span className="text-xs font-semibold text-foreground">
                      {status.progress_percentage}%
                    </span>
                    <span className="text-xs text-muted-foreground">100%</span>
                  </div>
                </div>

                {status.current_step && (
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">
                      Etapa Atual:
                    </span>
                    <p className="text-foreground font-medium">
                      {status.current_step}
                    </p>
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Data de Início
                    </span>
                    <p className="text-foreground font-medium">
                      {formatDate(status.start_date)}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Previsão de Conclusão
                    </span>
                    <p className="text-foreground font-medium">
                      {formatDate(status.expected_completion_date)}
                    </p>
                  </div>
                </div>

                {status.notes && (
                  <div className="pt-4 border-t">
                    <span className="text-sm font-medium text-muted-foreground">
                      Observações:
                    </span>
                    <p className="text-foreground mt-1">{status.notes}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Fases do Projeto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {timeline.map((phase, index) => {
                const isCompleted = index < currentPhaseIndex;
                const isCurrent = index === currentPhaseIndex;
                const isPending = index > currentPhaseIndex;

                return (
                  <motion.div
                    key={phase.phase}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`flex items-start gap-4 p-4 rounded-lg border transition-colors ${
                      isCurrent
                        ? 'border-primary bg-primary/5'
                        : isCompleted
                        ? 'border-green-500/30 bg-green-500/5'
                        : 'border-border bg-muted/30'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isCompleted
                          ? 'bg-green-500 text-white'
                          : isCurrent
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : isCurrent ? (
                        <Clock className="w-5 h-5" />
                      ) : (
                        <div className="w-3 h-3 rounded-full bg-current" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground">
                          {phase.title}
                        </h3>
                        {isCurrent && (
                          <Badge variant="default" className="text-xs">
                            Atual
                          </Badge>
                        )}
                        {isCompleted && (
                          <Badge className="bg-green-500 text-xs">
                            Concluído
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {phase.description}
                      </p>
                      <div className="mt-2">
                        <div className="w-full bg-muted rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full transition-all ${
                              isCompleted
                                ? 'bg-green-500'
                                : isCurrent
                                ? 'bg-primary'
                                : 'bg-muted'
                            }`}
                            style={{
                              width: isCompleted
                                ? '100%'
                                : isCurrent
                                ? `${status?.progress_percentage || 0}%`
                                : '0%',
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Project;

