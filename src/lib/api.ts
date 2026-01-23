const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  payment_day?: number;
  created_at?: string;
}

export interface LoginResponse {
  message: string;
  user: User;
  token: string;
}

export interface RegisterResponse extends LoginResponse {}

// Auth API
export const authApi = {
  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      // Verificar se a resposta é JSON ou HTML
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        try {
          const error = await response.json();
          throw new Error(error.error || 'Erro ao fazer login');
        } catch (e) {
          if (e instanceof Error && e.message.includes('JSON')) {
            throw new Error('Erro no servidor: Backend pode não estar rodando corretamente');
          }
          throw e;
        }
      } else {
        // Se não for JSON, provavelmente é HTML (erro do servidor)
        const text = await response.text();
        console.error('Backend retornou HTML em vez de JSON:', text.substring(0, 200));
        throw new Error(`Erro no servidor (${response.status}): Backend pode não estar rodando. Verifique os logs do container.`);
      }
    }

    return response.json();
  },

  async register(
    name: string,
    email: string,
    password: string,
    phone?: string,
    association_id?: number,
    payment_day?: number
  ): Promise<RegisterResponse> {
    const response = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, phone, association_id, payment_day }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao cadastrar');
    }

    return response.json();
  },

  async getCurrentUser(): Promise<{ user: User }> {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Não autenticado');

    const response = await fetch(`${API_URL}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Erro ao buscar usuário');
    }

    return response.json();
  },
};


// Contact API
export interface ContactResponse {
  message: string;
  user: User;
  contact: any;
  token?: string;
}

export const contactApi = {
  async createContact(data: {
    name: string;
    email: string;
    phone?: string;
    cpf: string;
    password: string;
    message?: string;
    association_id?: number;
  }): Promise<ContactResponse> {
    const response = await fetch(`${API_URL}/api/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao cadastrar');
    }

    return response.json();
  },
};

// Terms API
export interface Term {
  id: number;
  version: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface TermAcceptance {
  id: number;
  user_id: number;
  term_id: number;
  ip_address?: string;
  user_agent?: string;
  accepted_at: string;
}

export const termsApi = {
  async getActive(): Promise<{ term: Term }> {
    const response = await fetch(`${API_URL}/api/terms/active`);
    if (!response.ok) {
      throw new Error('Erro ao buscar termo de aceite');
    }
    return response.json();
  },

  async getById(id: number): Promise<{ term: Term }> {
    const response = await fetch(`${API_URL}/api/terms/${id}`);
    if (!response.ok) {
      throw new Error('Erro ao buscar termo');
    }
    return response.json();
  },

  async checkUserAcceptance(userId: number): Promise<{ accepted: boolean; acceptance: TermAcceptance | null; term: Term | null }> {
    const response = await fetch(`${API_URL}/api/terms/user/${userId}/acceptance`);
    if (!response.ok) {
      throw new Error('Erro ao verificar aceite');
    }
    return response.json();
  },

  async acceptTerm(userId: number, termId: number): Promise<{ acceptance: TermAcceptance }> {
    const ipAddress = await fetch('https://api.ipify.org?format=json')
      .then(res => res.json())
      .then(data => data.ip)
      .catch(() => null);

    const userAgent = navigator.userAgent;

    const response = await fetch(`${API_URL}/api/terms/accept`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        termId,
        ipAddress,
        userAgent,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao aceitar termo');
    }

    return response.json();
  },
};

// Associations API
export interface Association {
  id: number;
  cnpj: string;
  corporate_name: string;
  trade_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  website?: string;
  logo_url?: string;
  cover_url?: string;
  description?: string;
  facebook_url?: string;
  instagram_url?: string;
  youtube_url?: string;
  linkedin_url?: string;
  working_hours?: string;
  is_active: boolean;
  is_default: boolean;
  is_approved?: boolean;
}

export interface AdminAssociation extends Association {
  total_users?: number | string;
  active_users?: number | string;
  total_revenue?: number | string;
  paid_payments?: number | string;
  total_payments?: number | string;
  pending_payments?: number | string;
  overdue_payments?: number | string;
  created_at?: string;
  updated_at?: string;
}

  export const associationsApi = {
    async getAll(): Promise<{ associations: Association[] }> {
      try {
        const response = await fetch(`${API_URL}/api/associations`);

        if (!response.ok) {
          // Se o erro for 404 ou 500, retornar array vazio em vez de lançar erro
          if (response.status === 404 || response.status >= 500) {
            console.warn('Erro ao buscar associações:', response.status);
            return { associations: [] };
          }
          const error = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
          throw new Error(error.error || 'Erro ao buscar associações');
        }

        const data = await response.json();
        return { associations: data.associations || [] };
      } catch (error) {
        console.error('Erro na requisição de associações:', error);
        // Retornar array vazio em vez de lançar erro
        return { associations: [] };
      }
    },

  async getDefault(): Promise<{ association: Association }> {
    const response = await fetch(`${API_URL}/api/associations/default`);

    if (!response.ok) {
      throw new Error('Erro ao buscar associação padrão');
    }

    return response.json();
  },

  async getById(id: number): Promise<{ association: Association }> {
    const response = await fetch(`${API_URL}/api/associations/${id}`);

    if (!response.ok) {
      throw new Error('Erro ao buscar associação');
    }

    return response.json();
  },
};


// Dashboard API
export const dashboardApi = {
  async getStats() {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Não autenticado');

    const response = await fetch(`${API_URL}/api/dashboard/stats`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Erro ao buscar estatísticas');
    }

    return response.json();
  },

  async getRecentContacts() {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Não autenticado');

    const response = await fetch(`${API_URL}/api/dashboard/recent-contacts`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Erro ao buscar contatos');
    }

    return response.json();
  },
};


// Payments API
export interface Payment {
  id: number;
  amount: number;
  due_date: string;
  paid_date?: string;
  status: 'pending' | 'paid' | 'overdue';
  payment_method?: string;
  transaction_id?: string;
  ciabra_charge_id?: string;
  ciabra_pix_qr_code?: string;
  ciabra_pix_qr_code_url?: string;
  ciabra_boleto_url?: string;
  notes?: string;
  created_at: string;
}

export const paymentsApi = {
  async getPayments(): Promise<{ payments: Payment[] }> {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Não autenticado');

    const response = await fetch(`${API_URL}/api/payments`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Erro ao buscar pagamentos');
    }

    return response.json();
  },

  async getStats() {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Não autenticado');

    const response = await fetch(`${API_URL}/api/payments/stats`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Erro ao buscar estatísticas de pagamento');
    }

    return response.json();
  },

  async markAsPaid(paymentId: number, data?: { payment_method?: string; transaction_id?: string; notes?: string }) {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Não autenticado');

    const response = await fetch(`${API_URL}/api/payments/${paymentId}/pay`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data || {}),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao marcar pagamento como pago');
    }

    return response.json();
  },
};

// Ciabra API
export const ciabraApi = {
  async createCharge(paymentId: number | null, paymentMethod: 'pix' | 'boleto' = 'pix') {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Não autenticado');

    const body: any = { payment_method: paymentMethod };
    if (paymentId !== null && paymentId !== undefined) {
      body.payment_id = paymentId;
    }

    const response = await fetch(`${API_URL}/api/ciabra/charges`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao criar cobrança');
    }

    return response.json();
  },

  async getChargeStatus(chargeId: string) {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Não autenticado');

    const response = await fetch(`${API_URL}/api/ciabra/charges/${chargeId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao consultar cobrança');
    }

    return response.json();
  },
};


// Profile API
export interface UserProfile {
  id: number;
  user_id: number;
  cpf?: string;
  rg?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  birth_date?: string;
  marital_status?: string;
  occupation?: string;
  monthly_income?: number;
}

export const profileApi = {
  async getProfile(): Promise<{ user: User; profile: UserProfile | null }> {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Não autenticado');

    const response = await fetch(`${API_URL}/api/profile`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Erro ao buscar perfil');
    }

    return response.json();
  },

  async updateProfile(data: Partial<UserProfile>) {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Não autenticado');

    const response = await fetch(`${API_URL}/api/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao atualizar perfil');
    }

    return response.json();
  },

  async updatePaymentDay(paymentDay: 10 | 20) {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Não autenticado');

    const response = await fetch(`${API_URL}/api/profile/payment-day`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ payment_day: paymentDay }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao atualizar dia de pagamento');
    }

    return response.json();
  },
};


// Project API
export interface ProjectStatus {
  id: number;
  user_id: number;
  phase: string;
  progress_percentage: number;
  start_date?: string;
  expected_completion_date?: string;
  current_step?: string;
  notes?: string;
}

export const projectApi = {
  async getStatus(): Promise<{ status: ProjectStatus }> {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Não autenticado');

    const response = await fetch(`${API_URL}/api/project/status`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Erro ao buscar status do projeto');
    }

    return response.json();
  },

  async getTimeline(): Promise<{ phases: any[] }> {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Não autenticado');

    const response = await fetch(`${API_URL}/api/project/timeline`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Erro ao buscar timeline');
    }

    return response.json();
  },
};


// Admin API
export interface AdminDashboard {
  users: {
    total: number;
    active: number;
    inactive: number;
    newToday: number;
    newThisMonth: number;
    admins: number;
  };
  payments: {
    total: number;
    paid: number;
    pending: number;
    overdue: number;
    adimplentes: number;
    inadimplentes: number;
    avgValue: number;
  };
  revenue: {
    today: number;
    thisMonth: number;
    total: number;
  };
  contacts: {
    total: number;
    today: number;
    thisMonth: number;
  };
  trends: {
    paymentsByMonth: any[];
    revenueByMonth: any[];
  };
}

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  phone?: string;
  is_admin: boolean;
  is_active: boolean;
  created_at: string;
  cpf?: string;
  city?: string;
  state?: string;
  total_payments: number;
  paid_payments: number;
  total_paid: number;
}

export const adminApi = {
  async getDashboard(): Promise<AdminDashboard> {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Não autenticado');

    const response = await fetch(`${API_URL}/api/admin/dashboard`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Erro ao buscar dashboard administrativo');
    }

    return response.json();
  },

  async getUsers(params?: { page?: number; limit?: number; search?: string; status?: string }): Promise<{
    users: AdminUser[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Não autenticado');

    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.status) queryParams.append('status', params.status);

    const response = await fetch(`${API_URL}/api/admin/users?${queryParams}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Erro ao buscar usuários');
    }

    return response.json();
  },

  async getUserDetails(userId: number) {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Não autenticado');

    const response = await fetch(`${API_URL}/api/admin/users/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Erro ao buscar detalhes do usuário');
    }

    return response.json();
  },

  async updateUser(userId: number, data: Partial<AdminUser>) {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Não autenticado');

    const response = await fetch(`${API_URL}/api/admin/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao atualizar usuário');
    }

    return response.json();
  },

  async resetPassword(userId: number, newPassword: string) {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Não autenticado');

    const response = await fetch(`${API_URL}/api/admin/users/${userId}/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ newPassword }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao resetar senha');
    }

    return response.json();
  },

  async toggleUserActive(userId: number) {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Não autenticado');

    const response = await fetch(`${API_URL}/api/admin/users/${userId}/toggle-active`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao alterar status do usuário');
    }

    return response.json();
  },

  async getPaymentsReport(startDate?: string, endDate?: string) {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Não autenticado');

    const queryParams = new URLSearchParams();
    if (startDate) queryParams.append('startDate', startDate);
    if (endDate) queryParams.append('endDate', endDate);

    const response = await fetch(`${API_URL}/api/admin/reports/payments?${queryParams}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Erro ao gerar relatório');
    }

    return response.json();
  },

  async getOverdueReport() {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Não autenticado');

    const response = await fetch(`${API_URL}/api/admin/reports/overdue`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Erro ao gerar relatório de inadimplência');
    }

    return response.json();
  },

  // Associações
  async getAssociations(): Promise<{ associations: AdminAssociation[] }> {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Não autenticado');

    const response = await fetch(`${API_URL}/api/admin/associations`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Erro ao buscar associações');
    }

    return response.json();
  },

  async createAssociation(data: Partial<Association>): Promise<{ message: string; association: Association }> {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Não autenticado');

    const response = await fetch(`${API_URL}/api/admin/associations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao criar associação');
    }

    return response.json();
  },

  async updateAssociation(id: number, data: Partial<Association>): Promise<{ message: string; association: Association }> {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Não autenticado');

    const response = await fetch(`${API_URL}/api/admin/associations/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao atualizar associação');
    }

    return response.json();
  },

    async deleteAssociation(id: number): Promise<{ message: string }> {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Não autenticado');

      const response = await fetch(`${API_URL}/api/admin/associations/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao deletar associação');
      }

      return response.json();
    },

    async toggleAssociationActive(id: number): Promise<{ message: string }> {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Não autenticado');

      const response = await fetch(`${API_URL}/api/admin/associations/${id}/toggle-active`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao alterar status da associação');
      }

      return response.json();
    },

    async getAssociationUsers(id: number, params?: { page?: number; limit?: number; search?: string }): Promise<{
      users: AdminUser[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    }> {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Não autenticado');

      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.search) queryParams.append('search', params.search);

      const response = await fetch(`${API_URL}/api/admin/associations/${id}/users?${queryParams}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao buscar usuários da associação');
      }

      return response.json();
    },

    async getAssociationMetrics(id: number): Promise<{
      users: {
        total: number;
        active: number;
      };
      payments: {
        total: number;
        paid: number;
        pending: number;
        overdue: number;
      };
      revenue: {
        today: number;
        thisMonth: number;
        total: number;
      };
    }> {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Não autenticado');

      const response = await fetch(`${API_URL}/api/admin/associations/${id}/metrics`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao buscar métricas da associação');
      }

      return response.json();
    },
};

// Association Auth API
export interface AssociationAuth {
  id: number;
  email: string;
  corporate_name: string;
  trade_name?: string;
  is_active: boolean;
  is_approved: boolean;
}

export interface AssociationLoginResponse {
  message: string;
  association: AssociationAuth;
  token: string;
}

export interface AssociationRegisterData {
  cnpj: string;
  corporate_name: string;
  trade_name?: string;
  email: string;
  password: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  website?: string;
}

export const associationAuthApi = {
  async register(data: AssociationRegisterData): Promise<{ message: string; association: AssociationAuth }> {
    const response = await fetch(`${API_URL}/api/association-auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao cadastrar associação');
    }

    return response.json();
  },

  async login(email: string, password: string): Promise<AssociationLoginResponse> {
    const response = await fetch(`${API_URL}/api/association-auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao fazer login');
    }

    return response.json();
  },

  async getCurrentAssociation(): Promise<{ association: Association }> {
    const token = localStorage.getItem('association_token');
    if (!token) throw new Error('Não autenticado');

    const response = await fetch(`${API_URL}/api/association-auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Erro ao buscar associação');
    }

    return response.json();
  },
};


export interface AssociationMetrics {
  users: {
    total: number;
    active: number;
    inactive: number;
    growthRate: number;
  };
  payments: {
    total: number;
    paid: number;
    pending: number;
    overdue: number;
    complianceRate: number;
  };
  revenue: {
    today: number;
    thisMonth: number;
    lastMonth: number;
    total: number;
    growthRate: number;
  };
  charts: {
    revenueByMonth: Array<{ month: string; revenue: number }>;
    revenueByDay: Array<{ date: string; revenue: number }>;
    complianceByMonth: Array<{ month: string; paid: number; pending: number; total: number }>;
    userGrowth: Array<{ month: string; new_users: number }>;
  };
  topUsers: Array<{
    id: number;
    name: string;
    email: string;
    paid_count: number;
    total_paid: number;
  }>;
}

export interface AssociationUser {
  id: number;
  name: string;
  email: string;
  phone?: string;
  is_active: boolean;
  created_at: string;
  cpf?: string;
  city?: string;
  state?: string;
  total_payments: number;
  paid_payments: number;
  pending_payments: number;
  overdue_payments: number;
  total_paid: number;
  pending_amount: number;
}

export interface AssociationReport {
  period: {
    startDate: string;
    endDate: string;
  };
  financial: {
    paidCount: number;
    pendingCount: number;
    overdueCount: number;
    totalReceived: number;
    totalPending: number;
    totalOverdue: number;
  };
  payments: Array<{
    id: number;
    amount: number;
    due_date: string;
    paid_date?: string;
    status: string;
    payment_method?: string;
    user_name: string;
    user_email: string;
  }>;
  users: Array<{
    id: number;
    name: string;
    email: string;
    phone?: string;
    is_active: boolean;
    created_at: string;
    cpf?: string;
    city?: string;
    state?: string;
    total_payments: number;
    paid_payments: number;
    total_contributed: number;
  }>;
}

export const associationDashboardApi = {
  async getMetrics(): Promise<AssociationMetrics> {
    const token = localStorage.getItem('association_token');
    if (!token) throw new Error('Não autenticado');

    const response = await fetch(`${API_URL}/api/association-dashboard/metrics`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Erro ao buscar métricas');
    }

    return response.json();
  },

  async getUsers(page = 1, limit = 20, search = ''): Promise<{ users: AssociationUser[]; pagination: { page: number; limit: number; total: number; pages: number } }> {
    const token = localStorage.getItem('association_token');
    if (!token) throw new Error('Não autenticado');

    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (search) params.append('search', search);

    const response = await fetch(`${API_URL}/api/association-dashboard/users?${params}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Erro ao buscar usuários');
    }

    return response.json();
  },

  async getReports(startDate?: string, endDate?: string): Promise<AssociationReport> {
    const token = localStorage.getItem('association_token');
    if (!token) throw new Error('Não autenticado');

    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const response = await fetch(`${API_URL}/api/association-dashboard/reports?${params}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Erro ao buscar relatórios');
    }

    return response.json();
  },
};


