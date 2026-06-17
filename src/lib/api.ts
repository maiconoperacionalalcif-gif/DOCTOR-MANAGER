/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Clinica, Usuario, Paciente, Profissional, Agendamento, AgendamentoDetalhado, DashboardResumo } from '../types';

class ApiService {
  private currentClinicId: string = localStorage.getItem('doctor_manager_clinic_id') || 'c1';

  setClinicId(id: string) {
    this.currentClinicId = id;
    localStorage.setItem('doctor_manager_clinic_id', id);
  }

  getClinicId(): string {
    return this.currentClinicId;
  }

  private getHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      'x-clinic-id': this.currentClinicId,
    };
  }

  // General Fetch Handler
  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const url = `/api${path}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // 1. Auth & Clinics
  async getClinicas(): Promise<Clinica[]> {
    return this.request<Clinica[]>('/clinicas');
  }

  async checkEmail(email: string): Promise<{ userExists: boolean; clinics: Clinica[] }> {
    return this.request<{ userExists: boolean; clinics: Clinica[] }>('/auth/check-email', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async login(email: string, clinicId: string): Promise<{ user: Usuario; clinic: Clinica }> {
    const result = await this.request<{ user: Usuario; clinic: Clinica }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, clinicId }),
    });
    this.setClinicId(result.clinic.id);
    return result;
  }

  // 2. Dashboard
  async getDashboardStats(): Promise<DashboardResumo> {
    return this.request<DashboardResumo>('/dashboard');
  }

  // 3. Patients
  async getPacientes(): Promise<Paciente[]> {
    return this.request<Paciente[]>('/pacientes');
  }

  async createPaciente(paciente: Omit<Paciente, 'id' | 'clinica_id'>): Promise<Paciente> {
    return this.request<Paciente>('/pacientes', {
      method: 'POST',
      body: JSON.stringify(paciente),
    });
  }

  async updatePaciente(id: string, paciente: Partial<Paciente>): Promise<Paciente> {
    return this.request<Paciente>(`/pacientes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(paciente),
    });
  }

  async deletePaciente(id: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/pacientes/${id}`, {
      method: 'DELETE',
    });
  }

  // 4. Professionals
  async getProfissionais(): Promise<Profissional[]> {
    return this.request<Profissional[]>('/profissionais');
  }

  async createProfissional(profissional: Omit<Profissional, 'id' | 'clinica_id'>): Promise<Profissional> {
    return this.request<Profissional>('/profissionais', {
      method: 'POST',
      body: JSON.stringify(profissional),
    });
  }

  async updateProfissional(id: string, profissional: Partial<Profissional>): Promise<Profissional> {
    return this.request<Profissional>(`/profissionais/${id}`, {
      method: 'PUT',
      body: JSON.stringify(profissional),
    });
  }

  async deleteProfissional(id: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/profissionais/${id}`, {
      method: 'DELETE',
    });
  }

  // 5. Appointments
  async getAgendamentos(): Promise<AgendamentoDetalhado[]> {
    return this.request<AgendamentoDetalhado[]>('/agendamentos');
  }

  async createAgendamento(agendamento: Omit<Agendamento, 'id' | 'clinica_id'>): Promise<AgendamentoDetalhado> {
    return this.request<AgendamentoDetalhado>('/agendamentos', {
      method: 'POST',
      body: JSON.stringify(agendamento),
    });
  }

  async updateAgendamento(id: string, agendamento: Partial<Agendamento>): Promise<AgendamentoDetalhado> {
    return this.request<AgendamentoDetalhado>(`/agendamentos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(agendamento),
    });
  }

  async deleteAgendamento(id: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/agendamentos/${id}`, {
      method: 'DELETE',
    });
  }
}

export const api = new ApiService();
export default api;
