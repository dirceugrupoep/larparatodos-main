import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { Send, Phone, Mail, MapPin, MessageCircle, Heart, ArrowRight, Building2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { contactApi, associationsApi, Association, termsApi } from "@/lib/api";
import { TermsModal } from "@/components/TermsModal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const ContactSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [associations, setAssociations] = useState<Association[]>([]);
  const [isLoadingAssociations, setIsLoadingAssociations] = useState(true);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    cpf: "",
    password: "",
    confirmPassword: "",
    message: "",
    association_id: undefined as number | undefined,
    acceptedTerms: false,
  });
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [activeTermId, setActiveTermId] = useState<number | null>(null);

  useEffect(() => {
    loadAssociations();
    loadActiveTerm();
  }, []);

  const loadActiveTerm = async () => {
    try {
      const data = await termsApi.getActive();
      setActiveTermId(data.term.id);
    } catch (error) {
      console.error('Erro ao carregar termo:', error);
    }
  };

  const loadAssociations = async () => {
    try {
      setIsLoadingAssociations(true);
      const data = await associationsApi.getAll();
      
      if (data.associations && data.associations.length > 0) {
        setAssociations(data.associations);
        
        // Selecionar associação padrão automaticamente
        // Primeiro tenta encontrar por is_default = true
        let defaultAssociation = data.associations.find(a => a.is_default === true);
        
        // Se não encontrar, tenta encontrar por is_default sem comparação estrita
        if (!defaultAssociation) {
          defaultAssociation = data.associations.find(a => a.is_default);
        }
        
        if (defaultAssociation) {
          console.log('✅ Associação padrão encontrada:', defaultAssociation);
          setFormData(prev => ({ ...prev, association_id: defaultAssociation.id }));
        } else if (data.associations.length > 0) {
          // Se não houver padrão, selecionar a primeira
          console.log('⚠️ Nenhuma associação padrão encontrada, selecionando a primeira');
          setFormData(prev => ({ ...prev, association_id: data.associations[0].id }));
        }
      } else {
        // Se não houver associações, não mostrar erro, apenas deixar vazio
        console.warn('Nenhuma associação encontrada');
        setAssociations([]);
      }
    } catch (error) {
      console.error('Erro ao carregar associações:', error);
      // Não mostrar toast para não poluir a interface
      // Apenas deixar o array vazio
      setAssociations([]);
    } finally {
      setIsLoadingAssociations(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validação de senha
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem",
        variant: "destructive",
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: "Erro",
        description: "A senha deve ter pelo menos 6 caracteres",
        variant: "destructive",
      });
      return;
    }

    if (!formData.association_id) {
      toast({
        title: "Erro",
        description: "Por favor, selecione uma associação",
        variant: "destructive",
      });
      return;
    }

    if (!formData.acceptedTerms) {
      toast({
        title: "Atenção",
        description: "Você precisa aceitar os termos e condições para se cadastrar",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await contactApi.createContact({
        name: formData.name,
        email: formData.email,
        phone: formData.phone || undefined,
        cpf: formData.cpf,
        password: formData.password,
        message: formData.message || undefined,
        association_id: formData.association_id,
      });

      // Registrar aceite do termo
      if (activeTermId && response.user) {
        try {
          await termsApi.acceptTerm(response.user.id, activeTermId);
        } catch (error) {
          console.error('Erro ao registrar aceite do termo:', error);
          // Não bloqueia o cadastro se houver erro ao registrar o aceite
        }
      }

      toast({
        title: "Cadastro realizado!",
        description: response.message || "Sua conta foi criada com sucesso. Você já pode fazer login!",
      });

      // Se retornou token, salvar e redirecionar para dashboard
      if (response.token) {
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        
        // Redirecionar após 2 segundos
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 2000);
      }
      
      // Limpar formulário (manter associação selecionada)
      const currentAssociationId = formData.association_id;
      setFormData({ 
        name: "", 
        email: "", 
        phone: "", 
        cpf: "",
        password: "",
        confirmPassword: "",
        message: "",
        association_id: currentAssociationId,
        acceptedTerms: false
      });
    } catch (error) {
      toast({
        title: "Erro ao cadastrar",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const contactInfo = [
    {
      icon: Phone,
      label: "Telefone",
      value: "(11) 99999-9999",
    },
    {
      icon: Mail,
      label: "E-mail",
      value: "contato@larparatodos.org.br",
    },
    {
      icon: MapPin,
      label: "Localização",
      value: "São Paulo, SP",
    },
  ];

  return (
    <section
      id="contato"
      className="py-24 relative overflow-hidden"
      ref={ref}
    >
      {/* Background */}
      <div className="absolute inset-0 bg-foreground" />
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
        <motion.div
          className="absolute top-20 right-20 w-80 h-80 rounded-full bg-primary/5 blur-3xl"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 10, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-20 left-20 w-60 h-60 rounded-full bg-secondary/5 blur-3xl"
          animate={{ scale: [1.1, 1, 1.1] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Left - Info */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-block px-4 py-1.5 rounded-full bg-secondary/20 text-secondary font-medium text-sm uppercase tracking-wider mb-6">
                Entre em Contato
              </span>

              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-background mt-4 mb-6">
                Realize o{" "}
                <span className="bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent">
                  Sonho
                </span>{" "}
                da Casa Própria
              </h2>

              <p className="text-lg text-background/75 mb-10 leading-relaxed">
                Preencha o formulário ao lado ou entre em contato através de
                nossos canais. Nossa equipe está pronta para ajudar você.
              </p>

              {/* Contact Info */}
              <div className="space-y-4 mb-10">
                {contactInfo.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={isInView ? { opacity: 1, x: 0 } : {}}
                    transition={{ duration: 0.4, delay: 0.2 + index * 0.1 }}
                    className="flex items-center gap-4 p-4 rounded-xl bg-background/5 backdrop-blur-sm border border-background/10"
                  >
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <div>
                      <p className="text-sm text-background/50">{item.label}</p>
                      <p className="text-background font-semibold">{item.value}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* WhatsApp Button */}
              <Button
                size="lg"
                className="bg-[#25D366] hover:bg-[#20BD5A] text-white font-semibold text-base px-6 py-5"
                onClick={() => window.open("https://wa.me/5511999999999", "_blank")}
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Falar pelo WhatsApp
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </motion.div>

            {/* Right - Form */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 to-secondary/30 rounded-2xl blur-xl" />
                <form
                  onSubmit={handleSubmit}
                  className="relative p-6 md:p-8 rounded-2xl bg-card border border-border shadow-lg"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                      <Heart className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground">
                      Cadastro e Formulário de Interesse
                    </h3>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">
                        Nome completo
                      </label>
                      <Input
                        placeholder="Digite seu nome"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        required
                        className="h-12"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">
                        CPF
                      </label>
                      <Input
                        type="text"
                        placeholder="000.000.000-00"
                        value={formData.cpf}
                        onChange={(e) =>
                          setFormData({ ...formData, cpf: e.target.value })
                        }
                        required
                        className="h-12"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">
                        Associação <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground z-10" />
                        <Select
                          value={formData.association_id?.toString() || ''}
                          onValueChange={(value) =>
                            setFormData({ ...formData, association_id: parseInt(value) })
                          }
                          disabled={isLoadingAssociations || associations.length === 0}
                          required
                        >
                          <SelectTrigger className="pl-10 h-12">
                            <SelectValue placeholder={isLoadingAssociations ? 'Carregando...' : associations.length === 0 ? 'Nenhuma associação disponível' : 'Selecione uma associação'} />
                          </SelectTrigger>
                          <SelectContent>
                            {associations.map((association) => (
                              <SelectItem key={association.id} value={association.id.toString()}>
                                {association.trade_name || association.corporate_name}
                                {association.is_default && ' (Padrão)'}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-foreground mb-1.5 block">
                          E-mail
                        </label>
                        <Input
                          type="email"
                          placeholder="seu@email.com"
                          value={formData.email}
                          onChange={(e) =>
                            setFormData({ ...formData, email: e.target.value })
                          }
                          required
                          className="h-12"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground mb-1.5 block">
                          Telefone
                        </label>
                        <Input
                          type="tel"
                          placeholder="(11) 99999-9999"
                          value={formData.phone}
                          onChange={(e) =>
                            setFormData({ ...formData, phone: e.target.value })
                          }
                          required
                          className="h-12"
                        />
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-foreground mb-1.5 block">
                          Senha
                        </label>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          value={formData.password}
                          onChange={(e) =>
                            setFormData({ ...formData, password: e.target.value })
                          }
                          required
                          className="h-12"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground mb-1.5 block">
                          Confirmar Senha
                        </label>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          value={formData.confirmPassword}
                          onChange={(e) =>
                            setFormData({ ...formData, confirmPassword: e.target.value })
                          }
                          required
                          className="h-12"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">
                        Mensagem (opcional)
                      </label>
                      <Textarea
                        placeholder="Conte-nos sobre sua situação..."
                        value={formData.message}
                        onChange={(e) =>
                          setFormData({ ...formData, message: e.target.value })
                        }
                        rows={4}
                        className="resize-none"
                      />
                    </div>

                    <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 border border-border">
                      <Checkbox
                        id="terms-contact"
                        checked={formData.acceptedTerms}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, acceptedTerms: checked === true })
                        }
                        className="mt-1"
                      />
                      <label
                        htmlFor="terms-contact"
                        className="text-sm text-foreground cursor-pointer flex-1"
                      >
                        Eu aceito os{' '}
                        <button
                          type="button"
                          onClick={() => setShowTermsModal(true)}
                          className="text-primary hover:underline font-medium inline-flex items-center gap-1"
                        >
                          <FileText className="w-4 h-4" />
                          termos e condições de uso
                        </button>
                      </label>
                    </div>

                    <Button
                      type="submit"
                      size="lg"
                      className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity h-12 font-semibold"
                      disabled={isLoading || !formData.acceptedTerms}
                    >
                      <Send className="w-4 h-4 mr-2" />
                      {isLoading ? "Cadastrando..." : "Cadastrar e Enviar Interesse"}
                    </Button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <TermsModal
        open={showTermsModal}
        onOpenChange={setShowTermsModal}
        onAccept={() => {
          setFormData({ ...formData, acceptedTerms: true });
          setShowTermsModal(false);
        }}
      />
    </section>
  );
};
