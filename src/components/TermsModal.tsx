import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { termsApi } from '@/lib/api';

interface TermsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccept?: () => void;
  readOnly?: boolean;
}

export const TermsModal = ({ open, onOpenChange, onAccept, readOnly = false }: TermsModalProps) => {
  const [term, setTerm] = useState<{ id: number; version: string; title: string; content: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadTerm();
    }
  }, [open]);

  const loadTerm = async () => {
    try {
      setIsLoading(true);
      const data = await termsApi.getActive();
      setTerm(data.term);
    } catch (error) {
      console.error('Erro ao carregar termo:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = () => {
    if (onAccept) {
      onAccept();
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {term?.title || 'Termo de Aceite e Condições de Uso'}
          </DialogTitle>
          <DialogDescription>
            {term && `Versão ${term.version} - Por favor, leia atentamente antes de aceitar`}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Carregando termo...</p>
              </div>
            </div>
          ) : term ? (
            <div className="prose prose-sm max-w-none dark:prose-invert py-4">
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                {term.content}
              </pre>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Erro ao carregar termo de aceite</p>
            </div>
          )}
        </ScrollArea>
        {!readOnly && (
          <div className="flex justify-end gap-4 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAccept} disabled={isLoading || !term}>
              Aceito os Termos
            </Button>
          </div>
        )}
        {readOnly && (
          <div className="flex justify-end pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

