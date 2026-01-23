import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Building2, MapPin, Phone, Mail, Globe, Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { associationsApi, Association } from '@/lib/api';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const getImageUrl = (url?: string) => {
  if (!url) return undefined;
  // Se já é URL completa (http/https), retornar direto
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  // Se começa com /storage, já está no formato correto
  if (url.startsWith('/storage/')) return url;
  // Se é apenas o nome do arquivo, adicionar /storage/
  // O backend retorna URLs como https://dominio/storage/filename.png
  // Mas pode retornar apenas o filename, então construímos a URL completa
  if (url.includes('/')) {
    // Já tem path, usar direto
    return url.startsWith('/') ? url : `/${url}`;
  }
  // Apenas filename, adicionar /storage/
  return `/storage/${url}`;
};

const AssociationsList = () => {
  const navigate = useNavigate();
  const [associations, setAssociations] = useState<Association[]>([]);
  const [filteredAssociations, setFilteredAssociations] = useState<Association[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAssociations();
  }, []);

  useEffect(() => {
    const filtered = associations.filter((assoc) => {
      const search = searchTerm.toLowerCase();
      return (
        (assoc.trade_name?.toLowerCase().includes(search) ||
          assoc.corporate_name?.toLowerCase().includes(search) ||
          assoc.city?.toLowerCase().includes(search) ||
          assoc.state?.toLowerCase().includes(search)) &&
        !assoc.is_default
      );
    });
    setFilteredAssociations(filtered);
  }, [searchTerm, associations]);

  const loadAssociations = async () => {
    try {
      setIsLoading(true);
      const data = await associationsApi.getAll();
      // Filtrar associação default e apenas aprovadas e ativas
      const filtered = data.associations.filter(
        (a) => !a.is_default && a.is_active && a.is_approved
      );
      setAssociations(filtered);
      setFilteredAssociations(filtered);
    } catch (error) {
      console.error('Erro ao carregar associações:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-24 pb-12">
        <div className="container mx-auto px-4">
          {/* Header Section */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Nossas Associações
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Conheça as associações parceiras que fazem parte do Lar Para Todos
            </p>
          </motion.div>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8 max-w-2xl mx-auto"
          >
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                type="text"
                placeholder="Buscar por nome, cidade ou estado..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-12 text-lg"
              />
            </div>
          </motion.div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {/* Associations Grid */}
          {!isLoading && (
            <>
              {filteredAssociations.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12"
                >
                  <Building2 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg text-muted-foreground">
                    {searchTerm
                      ? 'Nenhuma associação encontrada com os critérios de busca'
                      : 'Nenhuma associação disponível no momento'}
                  </p>
                </motion.div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredAssociations.map((association, index) => (
                    <motion.div
                      key={association.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ y: -5 }}
                    >
                      <Card
                        className="cursor-pointer hover:shadow-xl transition-all duration-300 overflow-hidden group"
                        onClick={() => navigate(`/associations/${association.id}`)}
                      >
                        {/* Cover Image */}
                        <div className="relative h-48 bg-gradient-to-br from-primary to-secondary overflow-hidden">
                          {association.cover_url ? (
                            <img
                              src={getImageUrl(association.cover_url)}
                              alt={association.trade_name || association.corporate_name}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Building2 className="w-20 h-20 text-white/50" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                          {/* Logo Overlay */}
                          {association.logo_url && (
                            <div className="absolute bottom-4 left-4">
                              <img
                                src={getImageUrl(association.logo_url)}
                                alt="Logo"
                                className="w-16 h-16 rounded-lg object-cover border-2 border-white shadow-lg"
                              />
                            </div>
                          )}
                        </div>

                        <CardContent className="p-6">
                          <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                            {association.trade_name || association.corporate_name}
                          </h3>
                          {association.trade_name && (
                            <p className="text-sm text-muted-foreground mb-4">
                              {association.corporate_name}
                            </p>
                          )}

                          <div className="space-y-2">
                            {association.city && association.state && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <MapPin className="w-4 h-4" />
                                <span>
                                  {association.city}, {association.state}
                                </span>
                              </div>
                            )}
                            {association.phone && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Phone className="w-4 h-4" />
                                <span>{association.phone}</span>
                              </div>
                            )}
                            {association.email && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Mail className="w-4 h-4" />
                                <span className="truncate">{association.email}</span>
                              </div>
                            )}
                            {association.website && (
                              <div className="flex items-center gap-2 text-sm text-primary">
                                <Globe className="w-4 h-4" />
                                <a
                                  href={association.website}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="hover:underline"
                                >
                                  Website
                                </a>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default AssociationsList;

