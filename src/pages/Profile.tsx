import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { User, Save, Mail, Phone, MapPin, Calendar, Briefcase, CreditCard } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { profileApi, UserProfile } from '@/lib/api';
import { DashboardLayout } from '@/components/DashboardLayout';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const Profile = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Partial<UserProfile>>({});

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      const data = await profileApi.getProfile();
      setUser(data.user);
      setProfile(data.profile || {});
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao carregar perfil',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await profileApi.updateProfile(profile);
      toast({
        title: 'Sucesso!',
        description: 'Perfil atualizado com sucesso',
      });
      loadProfile();
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao salvar perfil',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
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
          <h2 className="text-3xl font-bold text-foreground mb-2">Meu Perfil</h2>
          <p className="text-muted-foreground">
            Atualize suas informações pessoais
          </p>
        </div>

        {/* User Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Informações Básicas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Nome Completo</Label>
                <Input value={user?.name || ''} disabled />
              </div>
              <div>
                <Label className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  E-mail
                </Label>
                <Input value={user?.email || ''} disabled />
              </div>
              <div>
                <Label className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Telefone
                </Label>
                <Input value={user?.phone || ''} disabled />
              </div>
              <div>
                <Label>CPF</Label>
                <Input
                  value={profile.cpf || ''}
                  onChange={(e) => setProfile({ ...profile, cpf: e.target.value })}
                  placeholder="000.000.000-00"
                />
              </div>
              <div>
                <Label>RG</Label>
                <Input
                  value={profile.rg || ''}
                  onChange={(e) => setProfile({ ...profile, rg: e.target.value })}
                  placeholder="00.000.000-0"
                />
              </div>
              <div>
                <Label className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Data de Nascimento
                </Label>
                <Input
                  type="date"
                  value={profile.birth_date || ''}
                  onChange={(e) => setProfile({ ...profile, birth_date: e.target.value })}
                />
              </div>
              <div>
                <Label>Estado Civil</Label>
                <Input
                  value={profile.marital_status || ''}
                  onChange={(e) => setProfile({ ...profile, marital_status: e.target.value })}
                  placeholder="Solteiro, Casado, etc"
                />
              </div>
              <div>
                <Label className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4" />
                  Ocupação
                </Label>
                <Input
                  value={profile.occupation || ''}
                  onChange={(e) => setProfile({ ...profile, occupation: e.target.value })}
                  placeholder="Profissão"
                />
              </div>
              <div>
                <Label>Renda Mensal</Label>
                <Input
                  type="number"
                  value={profile.monthly_income || ''}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      monthly_income: parseFloat(e.target.value) || undefined,
                    })
                  }
                  placeholder="0.00"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Address Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Endereço
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Endereço Completo</Label>
              <Input
                value={profile.address || ''}
                onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                placeholder="Rua, número, complemento"
              />
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label>Cidade</Label>
                <Input
                  value={profile.city || ''}
                  onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                  placeholder="Cidade"
                />
              </div>
              <div>
                <Label>Estado</Label>
                <Input
                  value={profile.state || ''}
                  onChange={(e) => setProfile({ ...profile, state: e.target.value })}
                  placeholder="SP"
                  maxLength={2}
                />
              </div>
              <div>
                <Label>CEP</Label>
                <Input
                  value={profile.zip_code || ''}
                  onChange={(e) => setProfile({ ...profile, zip_code: e.target.value })}
                  placeholder="00000-000"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Day Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Dia de Pagamento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Dia de Pagamento Mensal</Label>
              <Select
                value={user?.payment_day?.toString() || ''}
                onValueChange={async (value) => {
                  try {
                    await profileApi.updatePaymentDay(parseInt(value) as 10 | 20);
                    toast({
                      title: 'Sucesso!',
                      description: 'Dia de pagamento atualizado com sucesso',
                    });
                    loadProfile();
                  } catch (error) {
                    toast({
                      title: 'Erro',
                      description: error instanceof Error ? error.message : 'Erro ao atualizar dia de pagamento',
                      variant: 'destructive',
                    });
                  }
                }}
              >
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Selecione o dia de pagamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">Dia 10 de cada mês</SelectItem>
                  <SelectItem value="20">Dia 20 de cada mês</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1.5">
                Você sempre pagará nesta data. Esta data será usada para gerar suas cobranças mensais automaticamente.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isSaving} size="lg">
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Profile;

