import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Globe,
  ArrowLeft,
  Calendar,
  FileText,
  Facebook,
  Instagram,
  Youtube,
  Linkedin,
  Clock,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { associationsApi, Association } from '@/lib/api';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useToast } from '@/hooks/use-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const getImageUrl = (url?: string) => {
  if (!url) return undefined;
  // Se já é URL completa (http/https), retornar direto
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  // Se começa com /storage, já está no formato correto
  if (url.startsWith('/storage/')) return url;
  // Se é apenas o nome do arquivo, adicionar /storage/
  if (url.includes('/')) {
    return url.startsWith('/') ? url : `/${url}`;
  }
  // Apenas filename, adicionar /storage/
  return `/storage/${url}`;
};

const AssociationProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [association, setAssociation] = useState<Association | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadAssociation();
    }
  }, [id]);

  const loadAssociation = async () => {
    try {
      setIsLoading(true);
      const data = await associationsApi.getById(parseInt(id!));
      setAssociation(data.association);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Associação não encontrada',
        variant: 'destructive',
      });
      navigate('/associations');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!association) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-24">
        {/* Cover Section */}
        <div className="relative h-80 md:h-96 overflow-hidden">
          {association.cover_url ? (
            <img
              src={getImageUrl(association.cover_url)}
              alt={association.trade_name || association.corporate_name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary via-secondary to-accent flex items-center justify-center">
              <Building2 className="w-32 h-32 text-white/30" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
          
          {/* Back Button */}
          <div className="absolute top-4 left-4">
            <Button
              variant="secondary"
              onClick={() => navigate('/associations')}
              className="backdrop-blur-sm bg-background/80"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </div>
        </div>

        <div className="container mx-auto px-4 -mt-24 relative z-10">
          {/* Logo and Basic Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row gap-6 mb-8"
          >
            <Card className="p-2">
              {association.logo_url ? (
                <img
                  src={getImageUrl(association.logo_url)}
                  alt="Logo"
                  className="w-32 h-32 md:w-40 md:h-40 rounded-lg object-cover"
                />
              ) : (
                <div className="w-32 h-32 md:w-40 md:h-40 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                  <Building2 className="w-16 h-16 text-white/50" />
                </div>
              )}
            </Card>

            <div className="flex-1 pt-8">
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                {association.trade_name || association.corporate_name}
              </h1>
              {association.trade_name && (
                <p className="text-lg text-muted-foreground mb-4">
                  {association.corporate_name}
                </p>
              )}
              <div className="flex flex-wrap gap-4">
                {association.city && association.state && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-5 h-5" />
                    <span>
                      {association.city}, {association.state}
                    </span>
                  </div>
                )}
                {association.phone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="w-5 h-5" />
                    <span>{association.phone}</span>
                  </div>
                )}
                {association.email && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="w-5 h-5" />
                    <a
                      href={`mailto:${association.email}`}
                      className="hover:text-primary transition-colors"
                    >
                      {association.email}
                    </a>
                  </div>
                )}
                {association.website && (
                  <div className="flex items-center gap-2 text-primary">
                    <Globe className="w-5 h-5" />
                    <a
                      href={association.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline font-medium"
                    >
                      Website
                    </a>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Details Cards */}
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            {/* Contact Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    Informações de Contato
                  </h2>
                  <div className="space-y-4">
                    {association.cnpj && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">CNPJ</p>
                        <p className="font-medium">{association.cnpj}</p>
                      </div>
                    )}
                    {association.address && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Endereço</p>
                        <p className="font-medium">{association.address}</p>
                        {association.zip_code && (
                          <p className="text-sm text-muted-foreground">
                            CEP: {association.zip_code}
                          </p>
                        )}
                      </div>
                    )}
                    {association.phone && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Telefone</p>
                        <p className="font-medium">{association.phone}</p>
                      </div>
                    )}
                    {association.email && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">E-mail</p>
                        <a
                          href={`mailto:${association.email}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {association.email}
                        </a>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Additional Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary" />
                    Informações Adicionais
                  </h2>
                  <div className="space-y-4">
                    {association.website && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Website</p>
                        <a
                          href={association.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-primary hover:underline"
                        >
                          {association.website}
                        </a>
                      </div>
                    )}
                    {association.working_hours && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          Horário de Funcionamento
                        </p>
                        <p className="font-medium">{association.working_hours}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Status</p>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                        Ativa
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Descrição Rica */}
          {association.description && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mb-12"
            >
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    Sobre a Associação
                  </h2>
                  <div
                    className="prose prose-sm max-w-none dark:prose-invert"
                    dangerouslySetInnerHTML={{ __html: association.description }}
                  />
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Redes Sociais */}
          {(association.facebook_url || association.instagram_url || association.youtube_url || association.linkedin_url) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mb-12"
            >
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold text-foreground mb-4">Redes Sociais</h2>
                  <div className="flex flex-wrap gap-4">
                    {association.facebook_url && (
                      <a
                        href={association.facebook_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                      >
                        <Facebook className="w-5 h-5" />
                        Facebook
                      </a>
                    )}
                    {association.instagram_url && (
                      <a
                        href={association.instagram_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:opacity-90 transition-opacity"
                      >
                        <Instagram className="w-5 h-5" />
                        Instagram
                      </a>
                    )}
                    {association.youtube_url && (
                      <a
                        href={association.youtube_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
                      >
                        <Youtube className="w-5 h-5" />
                        YouTube
                      </a>
                    )}
                    {association.linkedin_url && (
                      <a
                        href={association.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-700 text-white hover:bg-blue-800 transition-colors"
                      >
                        <Linkedin className="w-5 h-5" />
                        LinkedIn
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default AssociationProfile;

