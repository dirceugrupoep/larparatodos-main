import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Building2,
  Upload,
  Save,
  MapPin,
  Phone,
  Mail,
  Globe,
  Image as ImageIcon,
  X,
  Loader2,
  Facebook,
  Instagram,
  Youtube,
  Linkedin,
  Clock,
  FileText,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { associationAuthApi, Association } from '@/lib/api';
import { AssociationLayout } from '@/components/AssociationLayout';
import { RichTextEditor } from '@/components/RichTextEditor';

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

const AssociationSettings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [association, setAssociation] = useState<Association | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  
  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    trade_name: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    website: '',
    description: '',
    facebook_url: '',
    instagram_url: '',
    youtube_url: '',
    linkedin_url: '',
    working_hours: '',
  });

  useEffect(() => {
    loadAssociation();
  }, []);

  const loadAssociation = async () => {
    try {
      setIsLoading(true);
      const data = await associationAuthApi.getCurrentAssociation();
      setAssociation(data.association);
      setFormData({
        trade_name: data.association.trade_name || '',
        phone: data.association.phone || '',
        address: data.association.address || '',
        city: data.association.city || '',
        state: data.association.state || '',
        zip_code: data.association.zip_code || '',
        website: data.association.website || '',
        description: data.association.description || '',
        facebook_url: data.association.facebook_url || '',
        instagram_url: data.association.instagram_url || '',
        youtube_url: data.association.youtube_url || '',
        linkedin_url: data.association.linkedin_url || '',
        working_hours: data.association.working_hours || '',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao carregar dados da associação',
        variant: 'destructive',
      });
      navigate('/association/login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const token = localStorage.getItem('association_token');
      if (!token) {
        throw new Error('Não autenticado');
      }

      const response = await fetch(`${API_URL}/api/association-auth/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao salvar');
      }

      const data = await response.json();
      setAssociation(data.association);
      
      toast({
        title: 'Sucesso',
        description: 'Dados atualizados com sucesso',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao salvar dados',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = async (file: File, type: 'logo' | 'cover') => {
    if (!file) return;

    // Validar tamanho (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Erro',
        description: 'A imagem deve ter no máximo 5MB',
        variant: 'destructive',
      });
      return;
    }

    // Validar tipo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Erro',
        description: 'Apenas imagens são permitidas (JPEG, PNG, GIF, WEBP)',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (type === 'logo') {
        setIsUploadingLogo(true);
      } else {
        setIsUploadingCover(true);
      }

      const token = localStorage.getItem('association_token');
      if (!token) {
        throw new Error('Não autenticado');
      }

      const formData = new FormData();
      formData.append(type, file);

      const response = await fetch(`${API_URL}/api/association-upload/${type}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao fazer upload');
      }

      const data = await response.json();
      
      // Atualizar URL da imagem
      setAssociation((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          [`${type}_url`]: data.url,
        };
      });

      toast({
        title: 'Sucesso',
        description: `${type === 'logo' ? 'Logo' : 'Capa'} enviada com sucesso`,
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao fazer upload',
        variant: 'destructive',
      });
    } finally {
      if (type === 'logo') {
        setIsUploadingLogo(false);
      } else {
        setIsUploadingCover(false);
      }
    }
  };

  if (isLoading) {
    return (
      <AssociationLayout>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Carregando...</p>
          </div>
        </div>
      </AssociationLayout>
    );
  }

  return (
    <AssociationLayout>
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold text-foreground mb-2">Configurações</h1>
          <p className="text-muted-foreground">
            Gerencie as informações e imagens da sua associação
          </p>
        </motion.div>

        {/* Imagens */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-primary" />
                  Logo da Associação
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  {association?.logo_url ? (
                    <div className="relative">
                      <img
                        src={getImageUrl(association.logo_url)}
                        alt="Logo"
                        className="w-32 h-32 rounded-lg object-cover border-2 border-border"
                      />
                      <button
                        onClick={() => {
                          setAssociation((prev) => {
                            if (!prev) return null;
                            return { ...prev, logo_url: undefined };
                          });
                        }}
                        className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center hover:bg-destructive/90"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-32 h-32 rounded-lg bg-muted flex items-center justify-center border-2 border-dashed border-border">
                      <Building2 className="w-12 h-12 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleImageUpload(file, 'logo');
                      }
                    }}
                  />
                  <Button
                    variant="outline"
                    onClick={() => logoInputRef.current?.click()}
                    disabled={isUploadingLogo}
                    className="w-full"
                  >
                    {isUploadingLogo ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        {association?.logo_url ? 'Alterar Logo' : 'Enviar Logo'}
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    Máximo 5MB. Formatos: JPEG, PNG, GIF, WEBP
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Capa */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-primary" />
                  Capa da Associação
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  {association?.cover_url ? (
                    <div className="relative">
                      <img
                        src={getImageUrl(association.cover_url)}
                        alt="Capa"
                        className="w-full h-32 rounded-lg object-cover border-2 border-border"
                      />
                      <button
                        onClick={() => {
                          setAssociation((prev) => {
                            if (!prev) return null;
                            return { ...prev, cover_url: undefined };
                          });
                        }}
                        className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center hover:bg-destructive/90"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-full h-32 rounded-lg bg-muted flex items-center justify-center border-2 border-dashed border-border">
                      <ImageIcon className="w-12 h-12 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div>
                  <input
                    ref={coverInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleImageUpload(file, 'cover');
                      }
                    }}
                  />
                  <Button
                    variant="outline"
                    onClick={() => coverInputRef.current?.click()}
                    disabled={isUploadingCover}
                    className="w-full"
                  >
                    {isUploadingCover ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        {association?.cover_url ? 'Alterar Capa' : 'Enviar Capa'}
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    Máximo 5MB. Formatos: JPEG, PNG, GIF, WEBP
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Informações */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Informações da Associação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="trade_name">Nome Fantasia</Label>
                  <Input
                    id="trade_name"
                    value={formData.trade_name}
                    onChange={(e) => handleInputChange('trade_name', e.target.value)}
                    placeholder="Nome fantasia"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="address">Endereço</Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="Rua, número, complemento"
                    rows={2}
                  />
                </div>
                <div>
                  <Label htmlFor="city">Cidade</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    placeholder="Cidade"
                  />
                </div>
                <div>
                  <Label htmlFor="state">Estado (UF)</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => handleInputChange('state', e.target.value.toUpperCase())}
                    placeholder="SP"
                    maxLength={2}
                  />
                </div>
                <div>
                  <Label htmlFor="zip_code">CEP</Label>
                  <Input
                    id="zip_code"
                    value={formData.zip_code}
                    onChange={(e) => handleInputChange('zip_code', e.target.value)}
                    placeholder="00000-000"
                  />
                </div>
                <div>
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={formData.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    placeholder="https://exemplo.com.br"
                    type="url"
                  />
                </div>
                <div>
                  <Label htmlFor="working_hours" className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Horário de Funcionamento
                  </Label>
                  <Input
                    id="working_hours"
                    value={formData.working_hours}
                    onChange={(e) => handleInputChange('working_hours', e.target.value)}
                    placeholder="Ex: Segunda a Sexta, 8h às 18h"
                  />
                </div>
              </div>

              {/* Descrição Rica */}
              <div>
                <Label htmlFor="description" className="flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4" />
                  Descrição da Associação
                </Label>
                <RichTextEditor
                  value={formData.description}
                  onChange={(value) => handleInputChange('description', value)}
                  placeholder="Descreva sua associação, missão, valores, projetos, etc. Você pode usar formatação, links e imagens."
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Use o editor para criar uma descrição rica e atrativa da sua associação
                </p>
              </div>

              {/* Redes Sociais */}
              <div>
                <Label className="mb-4 block">Redes Sociais</Label>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="facebook_url" className="flex items-center gap-2">
                      <Facebook className="w-4 h-4 text-blue-600" />
                      Facebook
                    </Label>
                    <Input
                      id="facebook_url"
                      value={formData.facebook_url}
                      onChange={(e) => handleInputChange('facebook_url', e.target.value)}
                      placeholder="https://facebook.com/sua-associacao"
                      type="url"
                    />
                  </div>
                  <div>
                    <Label htmlFor="instagram_url" className="flex items-center gap-2">
                      <Instagram className="w-4 h-4 text-pink-600" />
                      Instagram
                    </Label>
                    <Input
                      id="instagram_url"
                      value={formData.instagram_url}
                      onChange={(e) => handleInputChange('instagram_url', e.target.value)}
                      placeholder="https://instagram.com/sua-associacao"
                      type="url"
                    />
                  </div>
                  <div>
                    <Label htmlFor="youtube_url" className="flex items-center gap-2">
                      <Youtube className="w-4 h-4 text-red-600" />
                      YouTube
                    </Label>
                    <Input
                      id="youtube_url"
                      value={formData.youtube_url}
                      onChange={(e) => handleInputChange('youtube_url', e.target.value)}
                      placeholder="https://youtube.com/@sua-associacao"
                      type="url"
                    />
                  </div>
                  <div>
                    <Label htmlFor="linkedin_url" className="flex items-center gap-2">
                      <Linkedin className="w-4 h-4 text-blue-700" />
                      LinkedIn
                    </Label>
                    <Input
                      id="linkedin_url"
                      value={formData.linkedin_url}
                      onChange={(e) => handleInputChange('linkedin_url', e.target.value)}
                      placeholder="https://linkedin.com/company/sua-associacao"
                      type="url"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-4">
                <Button
                  variant="outline"
                  onClick={() => navigate('/association/dashboard')}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Salvar Alterações
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AssociationLayout>
  );
};

export default AssociationSettings;

