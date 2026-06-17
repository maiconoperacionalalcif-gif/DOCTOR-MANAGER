/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Clinica {
  id: string;
  nome: string;
  cnpj: string;
  tipo: 'Odontológica' | 'Médica' | 'Geral';
  endereco?: string;
  email?: string;
  telefone?: string;
}

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  clinica_id: string;
  funcao: 'admin' | 'recepcionista' | 'medico' | 'dentista';
}

export interface Paciente {
  id: string;
  nome: string;
  cpf: string;
  data_nascimento: string;
  telefone: string;
  email: string;
  convenio: string; // 'Particular', 'Unimed', 'SulAmérica', 'Bradesco Saude', 'Amil', etc.
  clinica_id: string;
}

export interface Profissional {
  id: string;
  nome: string;
  especialidade: string;
  registro: string; // CRM ou CRO
  tipo: 'CRM' | 'CRO';
  clinica_id: string;
}

export type StatusAgendamento = 'agendado' | 'confirmado' | 'cancelado';

export interface Agendamento {
  id: string;
  paciente_id: string;
  profissional_id: string;
  data_hora: string; // ISO 8601 YYYY-MM-DDTHH:mm
  duracao: number; // Em minutos (ex: 30, 45, 60)
  status: StatusAgendamento;
  observacoes?: string;
  clinica_id: string;
  valor?: number; // Para cálculo de receita do dia
}

// Relational formats for UI display
export interface AgendamentoDetalhado extends Agendamento {
  paciente?: Paciente;
  profissional?: Profissional;
}

export interface DashboardResumo {
  totalAgendamentos: number;
  confirmados: number;
  cancelados: number;
  agendados: number;
  receitaDoDia: number;
  hojeStr: string;
}
