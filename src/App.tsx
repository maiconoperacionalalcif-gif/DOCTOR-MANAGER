/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Calendar, 
  LayoutDashboard, 
  UserSquare2, 
  DollarSign, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  LogOut, 
  Phone, 
  Mail, 
  FileText, 
  ShieldAlert, 
  Sparkles, 
  ChevronLeft, 
  ChevronRight, 
  CalendarDays, 
  Database,
  Check,
  Stethoscope,
  Settings,
  AlertCircle
} from 'lucide-react';
import { api } from './lib/api';
import { 
  Clinica, 
  Usuario, 
  Paciente, 
  Profissional, 
  Agendamento, 
  AgendamentoDetalhado, 
  DashboardResumo,
  StatusAgendamento
} from './types';

export default function App() {
  // Authentication & Tenancy State
  const [clinicas, setClinicas] = useState<Clinica[]>([]);
  const [usuarioLogado, setUsuarioLogado] = useState<Usuario | null>(null);
  const [clinicaAtiva, setClinicaAtiva] = useState<Clinica | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [emailInput, setEmailInput] = useState('');
  const [senhaInput, setSenhaInput] = useState('');
  const [clinicSelect, setClinicSelect] = useState('c1');
  const [loginStep, setLoginStep] = useState<'email' | 'clinic-selection'>('email');
  const [userClinics, setUserClinics] = useState<Clinica[]>([]);
  const [authError, setAuthError] = useState<string | null>(null);

  // Supabase Real Connection State
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(false);
  const [showConnectionConfig, setShowConnectionConfig] = useState(false);

  // Active Screen
  // 'dashboard' | 'agenda' | 'pacientes' | 'profissionais'
  const [activeTab, setActiveTab] = useState<'dashboard' | 'agenda' | 'pacientes' | 'profissionais'>('dashboard');

  // Core Data States
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [profissionais, setProfissionais] = useState<Profissional[]>([]);
  const [agendamentos, setAgendamentos] = useState<AgendamentoDetalhado[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardResumo | null>(null);
  const [loadingData, setLoadingData] = useState(false);

  // Search and Filter States
  const [pacienteSearch, setPacienteSearch] = useState('');
  const [profissionalSearch, setProfissionalSearch] = useState('');
  const [agendaFiltroProfissional, setAgendaFiltroProfissional] = useState<string>('todos');

  // Week Calendar Navigation State (Default to today's week, i.e., around 2026-06-17)
  const [selectedWeekStart, setSelectedWeekStart] = useState<Date>(new Date('2026-06-15')); // Monday of that week

  // Modals & Panels States
  const [showPacienteModal, setShowPacienteModal] = useState(false);
  const [editingPaciente, setEditingPaciente] = useState<Paciente | null>(null);
  const [pacienteForm, setPacienteForm] = useState({
    nome: '',
    cpf: '',
    data_nascimento: '',
    telefone: '',
    email: '',
    convenio: 'Particular'
  });

  const [showProfissionalModal, setShowProfissionalModal] = useState(false);
  const [editingProfissional, setEditingProfissional] = useState<Profissional | null>(null);
  const [profissionalForm, setProfissionalForm] = useState({
    nome: '',
    especialidade: '',
    registro: '',
    tipo: 'CRM' as 'CRM' | 'CRO'
  });

  const [showAgendamentoModal, setShowAgendamentoModal] = useState(false);
  const [editingAgendamento, setEditingAgendamento] = useState<AgendamentoDetalhado | null>(null);
  const [agendamentoForm, setAgendamentoForm] = useState({
    paciente_id: '',
    profissional_id: '',
    data: '2026-06-17',
    hora: '09:00',
    duracao: 30,
    status: 'agendado' as StatusAgendamento,
    observacoes: '',
    valor: 150
  });

  // Init App Settings
  useEffect(() => {
    async function loadInitialData() {
      try {
        const clinicsList = await api.getClinicas();
        setClinicas(clinicsList);
        
        // Check if there is cached session
        const cachedUser = localStorage.getItem('doctor_manager_user');
        const cachedClinic = localStorage.getItem('doctor_manager_clinic');
        
        if (cachedUser && cachedClinic) {
          const user = JSON.parse(cachedUser);
          const clinic = JSON.parse(cachedClinic);
          setUsuarioLogado(user);
          setClinicaAtiva(clinic);
          api.setClinicId(clinic.id);
        }
      } catch (err) {
        console.error('Error loading initial databases', err);
      } finally {
        setLoadingAuth(false);
      }
    }
    loadInitialData();
  }, []);

  // Fetch tenant data when active clinic changes or tab changes
  useEffect(() => {
    if (clinicaAtiva) {
      fetchTenantData();
    }
  }, [clinicaAtiva, activeTab]);

  const fetchTenantData = async () => {
    setLoadingData(true);
    try {
      const [pac, prof, ag, dbStats] = await Promise.all([
        api.getPacientes(),
        api.getProfissionais(),
        api.getAgendamentos(),
        api.getDashboardStats()
      ]);
      setPacientes(pac);
      setProfissionais(prof);
      setAgendamentos(ag);
      setDashboardStats(dbStats);

      // Auto set first professional in filters if available
      if (prof.length > 0 && agendaFiltroProfissional === 'todos') {
        // preserve 'todos' or use first
      }
    } catch (err) {
      console.error('Erro ao buscar dados da clínica:', err);
    } finally {
      setLoadingData(false);
    }
  };

  // Auth Handlers
  const handleEmailCheckSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;
    setLoadingAuth(true);
    setAuthError(null);
    try {
      const { userExists, clinics } = await api.checkEmail(emailInput);
      setUserClinics(clinics);
      setLoginStep('clinic-selection');
    } catch (err: any) {
      console.error('Check email error:', err);
      setAuthError(err.message || 'Erro ao validar e-mail.');
    } finally {
      setLoadingAuth(false);
    }
  };

  const handleClinicSelectAndLogin = async (clinicId: string) => {
    setLoadingAuth(true);
    setAuthError(null);
    try {
      const { user, clinic } = await api.login(emailInput, clinicId);
      setUsuarioLogado(user);
      setClinicaAtiva(clinic);
      localStorage.setItem('doctor_manager_user', JSON.stringify(user));
      localStorage.setItem('doctor_manager_clinic', JSON.stringify(clinic));
      api.setClinicId(clinic.id);
      setActiveTab('dashboard');
    } catch (err: any) {
      console.error('Login error:', err);
      setAuthError(err.message || 'Erro ao conectar à clínica.');
    } finally {
      setLoadingAuth(false);
    }
  };

  const handleLogout = () => {
    setUsuarioLogado(null);
    setClinicaAtiva(null);
    setLoginStep('email');
    setUserClinics([]);
    setAuthError(null);
    localStorage.removeItem('doctor_manager_user');
    localStorage.removeItem('doctor_manager_clinic');
  };

  // Patient Submissions
  const openNewPaciente = () => {
    setEditingPaciente(null);
    setPacienteForm({
      nome: '',
      cpf: '',
      data_nascimento: '1990-01-01',
      telefone: '',
      email: '',
      convenio: 'Particular'
    });
    setShowPacienteModal(true);
  };

  const openEditPaciente = (p: Paciente) => {
    setEditingPaciente(p);
    setPacienteForm({
      nome: p.nome,
      cpf: p.cpf,
      data_nascimento: p.data_nascimento,
      telefone: p.telefone,
      email: p.email,
      convenio: p.convenio
    });
    setShowPacienteModal(true);
  };

  const handleSavePaciente = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPaciente) {
        await api.updatePaciente(editingPaciente.id, pacienteForm);
      } else {
        await api.createPaciente(pacienteForm);
      }
      setShowPacienteModal(false);
      fetchTenantData();
    } catch (err: any) {
      alert('Erro ao salvar paciente: ' + err.message);
    }
  };

  const handleDeletePaciente = async (id: string, name: string) => {
    if (confirm(`Tem certeza de que deseja excluir o paciente "${name}"? Todos os agendamentos relacionados também serão excluídos.`)) {
      try {
        await api.deletePaciente(id);
        fetchTenantData();
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  // Professional Submissions
  const openNewProfissional = () => {
    setEditingProfissional(null);
    setProfissionalForm({
      nome: '',
      especialidade: '',
      registro: '',
      tipo: clinicaAtiva?.tipo === 'Odontológica' ? 'CRO' : 'CRM'
    });
    setShowProfissionalModal(true);
  };

  const openEditProfissional = (p: Profissional) => {
    setEditingProfissional(p);
    setProfissionalForm({
      nome: p.nome,
      especialidade: p.especialidade,
      registro: p.registro,
      tipo: p.tipo
    });
    setShowProfissionalModal(true);
  };

  const handleSaveProfissional = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProfissional) {
        await api.updateProfissional(editingProfissional.id, profissionalForm);
      } else {
        await api.createProfissional(profissionalForm);
      }
      setShowProfissionalModal(false);
      fetchTenantData();
    } catch (err: any) {
      alert('Erro ao salvar profissional: ' + err.message);
    }
  };

  const handleDeleteProfissional = async (id: string, name: string) => {
    if (confirm(`Excluir profissional "${name}"? Os agendamentos associados serão deletados.`)) {
      try {
        await api.deleteProfissional(id);
        fetchTenantData();
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  // Appointment Submissions
  const openNewAgendamento = (initialDate?: string, initialHour?: string, initialProfId?: string) => {
    setEditingAgendamento(null);
    setAgendamentoForm({
      paciente_id: pacientes[0]?.id || '',
      profissional_id: initialProfId || profissionais[0]?.id || '',
      data: initialDate || '2026-06-17',
      hora: initialHour || '09:00',
      duracao: 30,
      status: 'agendado',
      observacoes: '',
      valor: clinicaAtiva?.tipo === 'Odontológica' ? 180 : 250
    });
    setShowAgendamentoModal(true);
  };

  const openEditAgendamento = (a: AgendamentoDetalhado) => {
    setEditingAgendamento(a);
    const [data, hora] = a.data_hora.split('T');
    setAgendamentoForm({
      paciente_id: a.paciente_id,
      profissional_id: a.profissional_id,
      data: data || '2026-06-17',
      hora: hora || '09:00',
      duracao: a.duracao,
      status: a.status,
      observacoes: a.observacoes || '',
      valor: a.valor || 150
    });
    setShowAgendamentoModal(true);
  };

  const handleSaveAgendamento = async (e: React.FormEvent) => {
    e.preventDefault();
    const data_hora = `${agendamentoForm.data}T${agendamentoForm.hora}`;
    const payload = {
      paciente_id: agendamentoForm.paciente_id,
      profissional_id: agendamentoForm.profissional_id,
      data_hora,
      duracao: Number(agendamentoForm.duracao),
      status: agendamentoForm.status,
      observacoes: agendamentoForm.observacoes,
      valor: Number(agendamentoForm.valor)
    };

    try {
      if (editingAgendamento) {
        await api.updateAgendamento(editingAgendamento.id, payload);
      } else {
        await api.createAgendamento(payload);
      }
      setShowAgendamentoModal(false);
      fetchTenantData();
    } catch (err: any) {
      alert('Erro ao salvar agendamento: ' + err.message);
    }
  };

  const handleUpdateStatus = async (id: string, status: StatusAgendamento) => {
    try {
      await api.updateAgendamento(id, { status });
      fetchTenantData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteAgendamento = async (id: string) => {
    if (confirm('Deseja realmente cancelar e excluir este agendamento definitivamente?')) {
      try {
        await api.deleteAgendamento(id);
        fetchTenantData();
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  // Supabase Custom Key Connector Handler
  const handleConnectSupabase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabaseUrl || !supabaseKey) {
      alert('Insira a URL e a Chave Anon do seu projeto Supabase.');
      return;
    }
    setIsSupabaseConnected(true);
    alert('Conexão simulada com o Supabase com Sucesso! O Doctor Manager agora está pronto para escutar o esquema configurado nas tabelas: clinicas, usuarios, pacientes, profissionais, agendamentos.');
    setShowConnectionConfig(false);
  };

  // Helper date generators for the Weekly Agenda Calendar component
  const getDaysOfWeek = (startDate: Date) => {
    const days = [];
    const start = new Date(startDate);
    for (let i = 0; i < 6; i++) { // Monday - Saturday
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      days.push(d);
    }
    return days;
  };

  const formatDayName = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = { weekday: 'short' };
    return date.toLocaleDateString('pt-BR', options).replace('.', '');
  };

  const formatDateString = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const moveWeek = (offset: number) => {
    const next = new Date(selectedWeekStart);
    next.setDate(selectedWeekStart.getDate() + offset * 7);
    setSelectedWeekStart(next);
  };

  // Filtered Lists & Autocomplete Options
  const filteredPacientes = pacientes.filter(p => 
    p.nome.toLowerCase().includes(pacienteSearch.toLowerCase()) ||
    p.cpf.includes(pacienteSearch) ||
    p.email.toLowerCase().includes(pacienteSearch.toLowerCase()) ||
    p.convenio.toLowerCase().includes(pacienteSearch.toLowerCase())
  );

  const filteredProfissionais = profissionais.filter(p =>
    p.nome.toLowerCase().includes(profissionalSearch.toLowerCase()) ||
    p.especialidade.toLowerCase().includes(profissionalSearch.toLowerCase()) ||
    p.registro.includes(profissionalSearch)
  );

  const timeSlots = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:10', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00',
    '16:30', '17:00', '17:30', '18:00'
  ];

  const weekDays = getDaysOfWeek(selectedWeekStart);

  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white" id="state-loading-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
        <h2 className="text-xl font-semibold tracking-wide font-display text-slate-200">DOCTOR MANAGER</h2>
        <p className="text-slate-400 text-sm mt-1">Carregando portal multi-clinicas...</p>
      </div>
    );
  }

  // Not Logged In View - Luxury Entrance Split Layout Portal
  if (!usuarioLogado || !clinicaAtiva) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col md:flex-row" id="auth-screen">
        {/* Left Side: Elegant Branding and SaaS pitch */}
        <div className="md:w-1/2 bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950 p-8 md:p-16 flex flex-col justify-between text-white border-r border-slate-800 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
          
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-500/20">DM</div>
            <span className="text-xl font-bold tracking-tight font-display bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">DOCTOR MANAGER</span>
          </div>

          <div className="my-auto py-12 relative z-10 max-w-lg">
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight font-display mt-4 leading-tight">
              A gestão definitiva para sua <span className="text-blue-500">clínica médica</span>.
            </h1>
            <p className="text-slate-400 text-base mt-4 leading-relaxed">
              Organize múltiplos consultórios em um único ecossistema. Agendas dinâmicas, prontuários, faturamento simplificado e controle completo de pacientes em conformidade com as diretrizes médicas nacionais.
            </p>
          </div>

          <div className="text-xs text-slate-500 flex items-center gap-2 relative z-10" id="current-date-box">
            <Sparkles className="w-4 h-4 text-blue-500 animate-pulse" />
            <span>Sistema com suporte legal ao CFM/CRO • 100% em Nuvem</span>
          </div>
        </div>

        {/* Right Side: Responsive Login Form of Clinic tenant */}
        <div className="md:w-1/2 p-8 md:p-16 flex items-center justify-center bg-slate-900 relative">
          <div className="w-full max-w-md bg-slate-950 p-8 rounded-2xl border border-slate-800 shadow-2xl">
            <h2 className="text-2xl font-bold font-display text-white">Entrar na sua Clínica</h2>
            <p className="text-slate-400 text-sm mt-1">
              {loginStep === 'email' 
                ? 'Insira as credenciais de acesso do profissional ou recepção' 
                : 'Selecione a qual clínica deseja se conectar neste momento'}
            </p>

            {loginStep === 'email' ? (
              <form onSubmit={handleEmailCheckSubmit} className="mt-6 space-y-4">
                {authError && (
                  <div className="p-3 bg-red-900/30 border border-red-500/40 text-red-200 text-xs rounded-lg flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <span>{authError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">E-mail do Profissional / Recepção</label>
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-slate-600"
                    placeholder="exemplo@clinicasorriso.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Senha de Acesso (Qualquer valor para simular)</label>
                  <input
                    type="password"
                    value={senhaInput}
                    onChange={(e) => setSenhaInput(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-slate-600"
                    placeholder="Sua senha secreta"
                  />
                </div>

                <button
                  type="submit"
                  id="btn-login-submit"
                  disabled={loadingAuth}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg text-sm font-bold hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-900/40 flex items-center justify-center gap-2"
                >
                  {loadingAuth ? 'Verificando...' : 'Avançar para Clínicas'}
                </button>
              </form>
            ) : (
              <div className="mt-6 space-y-4">
                <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg flex items-center justify-between">
                  <div className="truncate pr-2">
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Usuário Identificado</p>
                    <p className="text-xs text-blue-400 font-mono truncate">{emailInput}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setLoginStep('email');
                      setAuthError(null);
                    }}
                    className="text-[11px] text-slate-400 hover:text-white underline shrink-0"
                  >
                    Alterar
                  </button>
                </div>

                {authError && (
                  <div className="p-3 bg-red-900/30 border border-red-500/40 text-red-200 text-xs rounded-lg flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <span>{authError}</span>
                  </div>
                )}

                <div className="pt-2">
                  <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2.5">
                    {userClinics.length > 1 
                      ? 'Você possui vínculo com as seguintes clínicas:' 
                      : userClinics.length === 1 
                        ? 'Você está cadastrado nesta clínica:' 
                        : 'Selecione qual clínica deseja acessar para criar seu novo perfil:'}
                  </p>
                  
                  <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
                    {(userClinics.length > 0 ? userClinics : clinicas).map((cl) => (
                      <button
                        key={cl.id}
                        type="button"
                        disabled={loadingAuth}
                        onClick={() => handleClinicSelectAndLogin(cl.id)}
                        className="w-full flex items-start justify-between p-3.5 rounded-xl border border-slate-800 bg-slate-900/40 hover:bg-slate-900 hover:border-blue-500/50 text-left transition-all group duration-200"
                      >
                        <div className="truncate pr-2">
                          <p className="text-sm font-bold text-slate-200 group-hover:text-blue-400 transition-colors truncate">{cl.nome}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{cl.tipo} • CNPJ: {cl.cnpj}</p>
                          <p className="text-[10px] text-slate-500 mt-1 italic truncate">{cl.endereco}</p>
                        </div>
                        <div className="shrink-0 mt-1 w-7 h-7 rounded-lg bg-blue-950 border border-blue-800/30 flex items-center justify-center text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-all text-xs font-bold font-mono">
                          →
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setLoginStep('email');
                    setAuthError(null);
                  }}
                  className="w-full py-2.5 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white rounded-lg text-xs font-semibold transition-all"
                >
                  Voltar para o E-mail
                </button>
              </div>
            )}

            <div className="mt-6 pt-6 border-t border-slate-850 flex flex-col items-center">
              <p className="text-xs text-slate-500 text-center">
                O sistema é Multi-tenant. Ao realizar login com o e-mail, o sistema identifica automaticamente as clínicas vinculadas ao seu usuário e pergunta a qual deseja se conectar.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // LOGGED IN LAYOUT
  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden" id="applet-viewport">
      {/* Sidebar Navigation */}
      <nav id="nav-sidebar" className="w-64 bg-slate-900 flex flex-col h-full shrink-0 border-r border-slate-855 select-none text-white">
        {/* Brand Header */}
        <div className="p-6 flex items-center gap-3 border-b border-slate-850">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black text-sm tracking-widest shadow-md shadow-blue-900/30">DM</div>
          <div>
            <span className="font-extrabold tracking-tight text-sm font-display block text-white uppercase">DOCTOR MANAGER</span>
            <span className="text-[10px] text-blue-400 font-mono tracking-wider">Multi-tenant Cloud</span>
          </div>
        </div>

        {/* Tenant Switcher Status info */}
        <div className="px-6 py-4 bg-slate-950/50 border-b border-slate-850 flex flex-col gap-1.5">
          <p className="text-[10px] uppercase font-mono tracking-wider text-slate-400 font-bold block">Clínica Ativa</p>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-300 truncate w-44">{clinicaAtiva.nome}</span>
            <span className="px-1.5 py-0.5 bg-blue-900/50 border border-blue-500/20 text-[9px] rounded-md font-bold text-blue-200">
              {clinicaAtiva.tipo}
            </span>
          </div>
          <button 
            type="button" 
            onClick={handleLogout}
            className="mt-2 flex items-center gap-1.5 text-[10px] text-red-400 hover:text-red-300 transition-colors font-medium text-left"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sair desta clínica / Trocar tenant
          </button>
        </div>

        {/* Navigation Menus */}
        <div className="mt-4 flex-1 px-4 space-y-1">
          <button
            onClick={() => setActiveTab('dashboard')}
            id="tab-dashboard-link"
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
              activeTab === 'dashboard'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 shrink-0" />
            Dashboard Geral
          </button>

          <button
            onClick={() => setActiveTab('agenda')}
            id="tab-agenda-link"
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
              activeTab === 'agenda'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Calendar className="w-4 h-4 shrink-0" />
            Agenda Interativa
          </button>

          <button
            onClick={() => setActiveTab('pacientes')}
            id="tab-pacientes-link"
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
              activeTab === 'pacientes'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Users className="w-4 h-4 shrink-0" />
            Pacientes ({pacientes.length})
          </button>

          <button
            onClick={() => setActiveTab('profissionais')}
            id="tab-profissionais-link"
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
              activeTab === 'profissionais'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <UserSquare2 className="w-4 h-4 shrink-0" />
            Profissionais ({profissionais.length})
          </button>
        </div>

        {/* Database & Integration Config Card */}
        <div className="p-4 mt-auto border-t border-slate-850 bg-slate-950/40">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Database className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest block">Supabase Backend</span>
            </div>
            
            <p className="text-[10px] text-slate-500 leading-normal">
              {isSupabaseConnected 
                ? 'Conectado de forma segura ao seu projeto Supabase externo com sucesso.' 
                : 'Usando banco de dados SQLite local no contêiner com persistência durável.'}
            </p>

            <button
              onClick={() => setShowConnectionConfig(true)}
              className="mt-1.5 w-full bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold py-1.5 px-3 rounded-md transition-all flex items-center justify-center gap-1.5"
            >
              <Settings className="w-3 h-3" />
              {isSupabaseConnected ? 'Configurações Supabase' : 'Conectar Supabase Real'}
            </button>
          </div>
        </div>

        {/* User profile bottom item */}
        <div className="p-4 border-t border-slate-850 flex items-center gap-3 bg-slate-950/60 shrink-0">
          <div className="w-9 h-9 rounded-full bg-blue-500/20 text-blue-300 flex items-center justify-center font-bold text-sm border border-blue-500/30">
            {usuarioLogado.nome.substring(0,2).toUpperCase()}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-xs font-bold text-slate-200 truncate">{usuarioLogado.nome}</p>
            <p className="text-[9px] text-slate-500 uppercase font-mono truncate tracking-wider">{usuarioLogado.funcao} de TI</p>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <div className="flex-1 flex flex-col h-full min-w-0 bg-slate-50">
        
        {/* Header Bar */}
        <header id="applet-header" className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
          <div>
            <h2 className="text-base font-bold font-display text-slate-800 flex items-center gap-2">
              {activeTab === 'dashboard' && 'Painel de Controle Diário'}
              {activeTab === 'agenda' && 'Grade de Atendimentos Semanais'}
              {activeTab === 'pacientes' && 'Registro Integrado de Pacientes'}
              {activeTab === 'profissionais' && 'Corpo Clínico do Consultório'}
              {loadingData && <span className="animate-pulse text-xs text-blue-600 font-normal">(Carregando...)</span>}
            </h2>
            <p className="text-xs text-slate-500">
              Quarta-feira, 17 de Junho de 2026 • Horário do Servidor • {clinicaAtiva?.nome}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => openNewAgendamento()}
              id="header-new-appointment-btn"
              className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg shadow-sm hover:bg-blue-700 transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Novo Agendamento
            </button>
          </div>
        </header>

        {/* Dynamic Inner Tab Content */}
        <div className="flex-1 overflow-y-auto p-8">
          
          {/* TAB 1: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6" id="dashboard-tab-content">
              
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                
                {/* Agendamentos */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total agendamentos</p>
                    <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                      <CalendarDays className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-slate-900 font-mono" id="stat-total-appointments">
                      {dashboardStats?.totalAgendamentos ?? 0}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">hoje</span>
                  </div>
                </div>

                {/* Confirmados */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Confirmados</p>
                    <div className="p-1.5 bg-green-50 text-green-600 rounded-lg">
                      <CheckCircle className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-green-600 font-mono" id="stat-confirmed-appointments">
                      {dashboardStats?.confirmados ?? 0}
                    </span>
                    <span className="text-xs font-medium text-slate-400">
                      {dashboardStats?.totalAgendamentos 
                        ? `${Math.round((dashboardStats.confirmados / dashboardStats.totalAgendamentos) * 100)}%`
                        : '0%'}
                    </span>
                  </div>
                </div>

                {/* Cancelados */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Cancelados</p>
                    <div className="p-1.5 bg-red-50 text-red-600 rounded-lg">
                      <XCircle className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-red-500 font-mono" id="stat-cancelled-appointments">
                      {dashboardStats?.cancelados ?? 0}
                    </span>
                    <span className="text-xs font-medium text-slate-400">
                      {dashboardStats?.totalAgendamentos 
                        ? `${Math.round((dashboardStats.cancelados / dashboardStats.totalAgendamentos) * 100)}%`
                        : '0%'}
                    </span>
                  </div>
                </div>

                {/* Receita Prevista */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Receita Realizada (Do Dia)</p>
                    <div className="p-1.5 bg-green-50 text-green-600 rounded-lg">
                      <DollarSign className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xs font-bold text-slate-500">R$</span>
                    <span className="text-3xl font-extrabold text-slate-900 font-mono" id="stat-prevista-revenue">
                      {dashboardStats?.receitaDoDia.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) ?? '0,00'}
                    </span>
                  </div>
                </div>

              </div>

              {/* Detail section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Timeline Agendamentos de Hoje */}
                <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                  <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-slate-800 text-sm tracking-tight font-display">Agenda do dia (17 de Junho de 2026)</h3>
                      <p className="text-[11px] text-slate-400">Fila cronológica de atendimentos para hoje</p>
                    </div>
                    <button 
                      onClick={() => setActiveTab('agenda')}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 transition"
                    >
                      Acessar Calendário Semanal →
                    </button>
                  </div>

                  <div className="p-6 space-y-4 max-h-[480px] overflow-y-auto">
                    {agendamentos.filter(a => a.data_hora.startsWith('2026-06-17')).length === 0 ? (
                      <div className="py-12 text-center text-slate-400">
                        <AlertCircle className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                        <p className="text-sm">Nenhum atendimento agendado para o dia corrente.</p>
                        <button 
                          onClick={() => openNewAgendamento('2026-06-17')}
                          className="mt-3 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 font-semibold py-1.5 px-3 rounded-lg transition"
                        >
                          Adicionar primeiro agendamento
                        </button>
                      </div>
                    ) : (
                      agendamentos
                        .filter(a => a.data_hora.startsWith('2026-06-17'))
                        .sort((a,b) => a.data_hora.localeCompare(b.data_hora))
                        .map(a => {
                          const hora = a.data_hora.split('T')[1] || '';
                          return (
                            <div key={a.id} className="flex gap-4 items-start border-b border-slate-50 pb-4 last:border-0 last:pb-0">
                              <div className="w-16 shrink-0 text-right pt-1">
                                <p className="text-sm font-extrabold text-slate-800 font-mono">{hora}</p>
                                <p className="text-[10px] text-slate-400 uppercase font-bold">{a.duracao} min</p>
                              </div>
                              
                              <div className={`flex-1 p-4 rounded-r-xl border-l-4 transition-all hover:bg-slate-50/50 ${
                                a.status === 'confirmado' 
                                  ? 'bg-green-50/70 border-green-500 text-green-950' 
                                  : a.status === 'cancelado' 
                                    ? 'bg-red-50/40 border-red-500 text-slate-400 line-through' 
                                    : 'bg-blue-50/70 border-blue-500 text-blue-950'
                              }`}>
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                                  <div>
                                    <p className="font-bold text-sm leading-tight flex items-center gap-1.5">
                                      {a.paciente?.nome || 'Paciente não informado'}
                                      <span className="text-[10px] text-slate-400 bg-white/80 border border-slate-100 font-normal px-1.5 py-0.5 rounded uppercase">
                                        {a.paciente?.convenio}
                                      </span>
                                    </p>
                                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                                      <Stethoscope className="w-3.5 h-3.5 text-blue-500" />
                                      {a.profissional?.nome} ({a.profissional?.especialidade})
                                    </p>
                                    {a.observacoes && (
                                      <p className="text-[11px] text-slate-400 font-mono italic mt-1.5">
                                        Obs: {a.observacoes}
                                      </p>
                                    )}
                                  </div>

                                  <div className="flex flex-wrap items-center gap-2">
                                    {/* Action tags */}
                                    <span className={`text-[9px] uppercase font-bold tracking-wider px-2 py-1 rounded-md ${
                                      a.status === 'confirmado' 
                                        ? 'bg-green-100 text-green-800 border border-green-200' 
                                        : a.status === 'cancelado' 
                                          ? 'bg-red-100 text-red-800 border border-red-200' 
                                          : 'bg-blue-100 text-blue-800 border border-blue-200'
                                    }`}>
                                      {a.status}
                                    </span>

                                    {/* Action togglers */}
                                    {a.status === 'agendado' && (
                                      <button 
                                        onClick={() => handleUpdateStatus(a.id, 'confirmado')}
                                        className="p-1 bg-white hover:bg-green-50 hover:text-green-600 rounded border border-slate-200 text-slate-500 transition-colors"
                                        title="Confirmar Atendimento"
                                      >
                                        <Check className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                    {a.status !== 'cancelado' && (
                                      <button 
                                        onClick={() => handleUpdateStatus(a.id, 'cancelado')}
                                        className="p-1 bg-white hover:bg-red-50 hover:text-red-500 rounded border border-slate-200 text-slate-500 transition-colors"
                                        title="Cancelar"
                                      >
                                        <XCircle className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                    
                                    <button 
                                      onClick={() => openEditAgendamento(a)}
                                      className="p-1 bg-white hover:bg-blue-50 text-slate-500 hover:text-blue-600 rounded border border-slate-200"
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })
                    )}
                  </div>
                </div>

                {/* Direita: Últimos Pacientes Cadastrados & Profissionais Ativos */}
                <div className="space-y-6">
                  
                  {/* Pacientes Recentes */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                    <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                      <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider font-display">Pacientes Recentes</h3>
                      <button 
                        onClick={() => setActiveTab('pacientes')}
                        className="text-xs text-blue-600 font-semibold"
                      >
                        Ver todos
                      </button>
                    </div>

                    <div className="p-3 divide-y divide-slate-100">
                      {pacientes.slice(-4).reverse().map(p => (
                        <div 
                          key={p.id} 
                          onClick={() => openEditPaciente(p)}
                          className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-lg cursor-pointer transition"
                        >
                          <div className="w-8 h-8 rounded bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-extrabold uppercase font-mono">
                            {p.nome.substring(0,2)}
                          </div>
                          <div className="flex-1 overflow-hidden">
                            <p className="text-xs font-bold text-slate-800 truncate">{p.nome}</p>
                            <p className="text-[10px] text-slate-500 font-mono mt-0.5 truncate">{p.convenio} • Telefone: {p.telefone}</p>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Profissionais de Plantão / Info */}
                  <div className="bg-blue-900 rounded-xl p-5 text-white shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/30 rounded-full blur-2xl"></div>
                    
                    <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-blue-200 mb-3 block">Corpo de Consultório Ativo</h4>
                    
                    <div className="flex -space-x-2.5 my-4">
                      {profissionais.map((prof, idx) => (
                        <div 
                          key={prof.id} 
                          className="w-10 h-10 rounded-full border-2 border-blue-900 bg-slate-800 text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm"
                          title={`${prof.nome} - ${prof.especialidade}`}
                        >
                          {prof.nome.replace('Dr. ', '').replace('Dra. ', '').substring(0, 2)}
                        </div>
                      ))}
                      {profissionais.length === 0 && (
                        <span className="text-xs text-blue-200 italic">Nenhum médico cadastrado ainda</span>
                      )}
                    </div>

                    <p className="text-xs text-blue-100 leading-normal font-sans">
                      Dica SaaS: Cada profissional possui visualizações isoladas vinculadas aos seus respectivos registros de <strong>CRM / CRO</strong>. Customize agendas personalizadas para cada um no calendário semanal.
                    </p>
                  </div>
                  
                </div>

              </div>

            </div>
          )}

          {/* TAB 2: INTERACTIVE WEEKLY AGENDA */}
          {activeTab === 'agenda' && (
            <div className="space-y-6" id="agenda-tab-content">
              
              {/* Filter and Switch bar */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                
                {/* Professional Selector Filter */}
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Profissional:</span>
                  <select
                    value={agendaFiltroProfissional}
                    onChange={(e) => setAgendaFiltroProfissional(e.target.value)}
                    className="bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold px-3 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="todos">Todos os Profissionais</option>
                    {profissionais.map(p => (
                      <option key={p.id} value={p.id}>{p.nome} ({p.especialidade})</option>
                    ))}
                  </select>
                </div>

                {/* Week Pager */}
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => moveWeek(-1)}
                    className="p-1.5 hover:bg-slate-100 rounded-lg border border-slate-200 text-slate-600 transition"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-bold text-slate-800 font-mono px-2 bg-slate-50 py-1 border border-slate-100 rounded">
                    Semana de {weekDays[0].toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} a {weekDays[5].toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                  </span>
                  <button 
                    onClick={() => moveWeek(1)}
                    className="p-1.5 hover:bg-slate-100 rounded-lg border border-slate-200 text-slate-600 transition"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                  <span className="inline-block w-2.5 h-2.5 bg-blue-500 rounded"></span> Agendado
                  <span className="inline-block w-2.5 h-2.5 bg-green-500 rounded ml-2"></span> Confirmado
                  <span className="inline-block w-2.5 h-2.5 bg-red-400 rounded ml-2"></span> Cancelado
                </div>

              </div>

              {/* Weekly Calendar Grid */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                
                {/* Header Row: Column of days */}
                <div className="grid grid-cols-6 border-b border-slate-200 bg-slate-50 text-center text-xs font-bold text-slate-700 divide-x divide-slate-200">
                  {weekDays.map((date) => {
                    const isToday = formatDateString(date) === '2026-06-17';
                    return (
                      <div key={date.toString()} className={`py-3.5 px-2 flex flex-col items-center gap-0.5 ${isToday ? 'bg-blue-50 text-blue-700' : ''}`}>
                        <span className="uppercase text-[10px] tracking-widest block font-bold">{formatDayName(date)}</span>
                        <span className="text-base font-extrabold font-mono mt-0.5">{date.getDate()}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Calendar Body Slots */}
                <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
                  {timeSlots.map(timeStr => (
                    <div key={timeStr} className="grid grid-cols-6 divide-x divide-slate-200 min-h-[72px]">
                      {weekDays.map(date => {
                        const dateStr = formatDateString(date);
                        const matchDateTime = `${dateStr}T${timeStr}`;
                        
                        // Filters matching appointments
                        const matchingAgendamentos = agendamentos.filter(a => {
                          const hasDateHour = a.data_hora === matchDateTime;
                          const matchesProf = agendaFiltroProfissional === 'todos' || a.profissional_id === agendaFiltroProfissional;
                          return hasDateHour && matchesProf;
                        });

                        return (
                          <div 
                            key={`${dateStr}-${timeStr}`} 
                            className="p-1 px-1.5 hover:bg-slate-50/50 group relative transition-colors flex flex-col justify-between"
                          >
                            <span className="text-[10px] font-mono text-slate-400 block group-hover:text-blue-500 transition">
                              {timeStr}
                            </span>

                            {/* Appointments list in this exact slot */}
                            <div className="space-y-1 mt-1">
                              {matchingAgendamentos.map(a => (
                                <div
                                  key={a.id}
                                  onClick={() => openEditAgendamento(a)}
                                  className={`p-1.5 rounded text-[10px] leading-tight cursor-pointer font-medium border shadow-xs transition hover:scale-[1.02] ${
                                    a.status === 'confirmado'
                                      ? 'bg-green-100 text-green-900 border-green-200'
                                      : a.status === 'cancelado'
                                        ? 'bg-red-50 text-slate-400 line-through border-red-100'
                                        : 'bg-blue-100 text-blue-900 border-blue-200'
                                  }`}
                                  title={`${a.paciente?.nome} - Dr(a) ${a.profissional?.nome}`}
                                >
                                  <p className="font-bold truncate">{a.paciente?.nome}</p>
                                  <p className="opacity-80 text-[8px] truncate">{a.profissional?.nome?.replace('Dra. ', '')?.replace('Dr. ', '')}</p>
                                </div>
                              ))}
                            </div>

                            {/* Inline Plus quick appointment creation button */}
                            {matchingAgendamentos.length === 0 && (
                              <button
                                onClick={() => openNewAgendamento(dateStr, timeStr, agendaFiltroProfissional !== 'todos' ? agendaFiltroProfissional : undefined)}
                                className="opacity-0 group-hover:opacity-100 mt-1 self-end w-5 h-5 bg-blue-100 hover:bg-blue-600 text-blue-600 hover:text-white rounded-full flex items-center justify-center transition-all shadow-sm"
                                title="Reservar horário"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>

              </div>

            </div>
          )}

          {/* TAB 3: PATIENTS LIST / SEARCH */}
          {activeTab === 'pacientes' && (
            <div className="space-y-6" id="pacientes-tab-content">
              
              {/* Header actions */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={pacienteSearch}
                    onChange={(e) => setPacienteSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800"
                    placeholder="Buscar pacientes por nome, CPF, e-mail ou convênio..."
                  />
                </div>

                <button
                  onClick={openNewPaciente}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  Visualizar / Adicionar Novo Paciente
                </button>
              </div>

              {/* Table list */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-widest border-b border-slate-200">
                      <th className="py-4 px-6">Nome do Paciente</th>
                      <th className="py-4 px-6">CPF</th>
                      <th className="py-4 px-6">Nascimento</th>
                      <th className="py-4 px-6">Contato</th>
                      <th className="py-4 px-6">Convênio</th>
                      <th className="py-4 px-6 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredPacientes.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">
                          Nenhum paciente encontrado com o filtro informado.
                        </td>
                      </tr>
                    ) : (
                      filteredPacientes.map(p => (
                        <tr key={p.id} className="hover:bg-slate-50/50 transition">
                          <td className="py-4 px-6 font-bold text-slate-800 text-sm">
                            {p.nome}
                          </td>
                          <td className="py-4 px-6 text-slate-600 font-mono">
                            {p.cpf || '—'}
                          </td>
                          <td className="py-4 px-6 text-slate-600 font-mono">
                            {p.data_nascimento ? new Date(p.data_nascimento + 'T12:00:00').toLocaleDateString('pt-BR') : '—'}
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex flex-col gap-0.5">
                              <span className="text-slate-700 flex items-center gap-1">
                                <Phone className="w-3 h-3 text-slate-400" /> {p.telefone}
                              </span>
                              <span className="text-slate-400 text-[10px] flex items-center gap-1 mt-0.5 truncate max-w-[180px]">
                                <Mail className="w-3 h-3 text-slate-400" /> {p.email}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <span className="px-2 py-0.5 bg-blue-50 border border-blue-100 text-blue-800 text-[10px] font-bold rounded-md">
                              {p.convenio}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => openEditPaciente(p)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded border border-slate-100 transition"
                                title="Editar"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeletePaciente(p.id, p.nome)}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded border border-slate-100 transition"
                                title="Excluir"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

            </div>
          )}

          {/* TAB 4: PROFESSIONALS LIST */}
          {activeTab === 'profissionais' && (
            <div className="space-y-6" id="profissionais-tab-content">
              {/* Header actions */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={profissionalSearch}
                    onChange={(e) => setProfissionalSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800"
                    placeholder="Buscar profissional por nome, registro ou especialidade..."
                  />
                </div>

                <button
                  onClick={openNewProfissional}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar Profissional (Médico / Dentista)
                </button>
              </div>

              {/* Bento Grid layout of Clinicians */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {filteredProfissionais.map(p => (
                  <div key={p.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between p-6 transition-all hover:-translate-y-0.5 hover:shadow-md">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="px-2.5 py-1 bg-slate-900 text-white text-[10px] font-bold tracking-wider rounded-md font-mono uppercase">
                          {p.tipo} registrado
                        </span>

                        <div className="flex gap-1.5">
                          <button
                            onClick={() => openEditProfissional(p)}
                            className="p-1 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded transition border border-slate-100"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteProfissional(p.id, p.nome)}
                            className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded transition border border-slate-100"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <h3 className="text-base font-extrabold text-slate-800 font-display">{p.nome}</h3>
                      <p className="text-xs text-blue-600 font-semibold mt-1">{p.especialidade}</p>
                      
                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 mt-4 text-[11px] font-mono text-slate-500">
                        NÚMERO DE REGISTRO: <span className="font-bold text-slate-700">{p.registro}</span>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center text-xs">
                      <span className="text-slate-400">Escopo Multi-tenant</span>
                      <span className="text-slate-700 font-bold flex items-center gap-1">
                        <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span>
                        Disponível
                      </span>
                    </div>
                  </div>
                ))}

                {filteredProfissionais.length === 0 && (
                  <div className="col-span-3 py-16 text-center text-slate-400 bg-white border border-dashed rounded-xl">
                    <UserSquare2 className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="text-sm font-medium">Nenhum profissional clínico encontrado para o filtro digitado.</p>
                  </div>
                )}
              </div>

            </div>
          )}

        </div>
      </div>

      {/* MODAL 1: ADD/EDIT PATIENT */}
      {showPacienteModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg border border-slate-200 overflow-hidden shadow-2xl">
            <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-base font-display">
                  {editingPaciente ? 'Editar Cadastro de Paciente' : 'Adicionar Novo Paciente'}
                </h3>
                <p className="text-xs text-slate-400 mt-1">Multi-tenant isolado sob a ID {clinicaAtiva?.nome}</p>
              </div>
              <button 
                onClick={() => setShowPacienteModal(false)}
                className="text-slate-400 hover:text-white transition text-xs font-bold"
              >
                X fechar
              </button>
            </div>

            <form onSubmit={handleSavePaciente} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-extrabold uppercase tracking-widest text-slate-500 mb-1">Nome Completo</label>
                  <input
                    type="text"
                    required
                    value={pacienteForm.nome}
                    onChange={(e) => setPacienteForm({ ...pacienteForm, nome: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800"
                    placeholder="Ex: Amanda Santos de Souza"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold uppercase tracking-widest text-slate-500 mb-1">CPF</label>
                  <input
                    type="text"
                    value={pacienteForm.cpf}
                    onChange={(e) => setPacienteForm({ ...pacienteForm, cpf: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800"
                    placeholder="Ex: 123.456.789-00"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold uppercase tracking-widest text-slate-500 mb-1">Data de Nascimento</label>
                  <input
                    type="date"
                    value={pacienteForm.data_nascimento}
                    onChange={(e) => setPacienteForm({ ...pacienteForm, data_nascimento: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold uppercase tracking-widest text-slate-500 mb-1">Celular / Telefone</label>
                  <input
                    type="text"
                    value={pacienteForm.telefone}
                    onChange={(e) => setPacienteForm({ ...pacienteForm, telefone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800"
                    placeholder="Ex: (11) 98888-7777"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold uppercase tracking-widest text-slate-500 mb-1">E-mail</label>
                  <input
                    type="email"
                    value={pacienteForm.email}
                    onChange={(e) => setPacienteForm({ ...pacienteForm, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800"
                    placeholder="Ex: amanda@email.com"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[11px] font-extrabold uppercase tracking-widest text-slate-500 mb-1">Convênio / Cobertura médica</label>
                  <select
                    value={pacienteForm.convenio}
                    onChange={(e) => setPacienteForm({ ...pacienteForm, convenio: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800"
                  >
                    <option value="Particular">Particular (Sem convênio)</option>
                    <option value="Unimed">Unimed</option>
                    <option value="Bradesco Saúde">Bradesco Saúde</option>
                    <option value="SulAmérica">SulAmérica Saúde</option>
                    <option value="Amil">Amil</option>
                    <option value="Amil Dental">Amil Dental (Odontologia)</option>
                    <option value="Intermédica">NotreDame Intermédica</option>
                  </select>
                </div>

              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPacienteModal(false)}
                  className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  id="btn-save-paciente"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold"
                >
                  Salvar Cadastrado
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD/EDIT PROFESSIONAL */}
      {showProfissionalModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md border border-slate-200 overflow-hidden shadow-2xl">
            <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-base font-display">
                  {editingProfissional ? 'Editar Profissional' : 'Novo Profissional Clínico'}
                </h3>
                <p className="text-xs text-slate-400 mt-1">Multi-tenant: {clinicaAtiva?.nome}</p>
              </div>
              <button 
                onClick={() => setShowProfissionalModal(false)}
                className="text-slate-400 hover:text-white transition text-xs font-bold"
              >
                X fechar
              </button>
            </div>

            <form onSubmit={handleSaveProfissional} className="p-6 space-y-4">
              <div>
                <label className="block text-[11px] font-extrabold uppercase tracking-widest text-slate-500 mb-1">Nome Completo</label>
                <input
                  type="text"
                  required
                  value={profissionalForm.nome}
                  onChange={(e) => setProfissionalForm({ ...profissionalForm, nome: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800"
                  placeholder="Ex: Dra. Roberta Albuquerque Mendes"
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold uppercase tracking-widest text-slate-500 mb-1">Especialidade Clínica</label>
                <input
                  type="text"
                  required
                  value={profissionalForm.especialidade}
                  onChange={(e) => setProfissionalForm({ ...profissionalForm, especialidade: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800"
                  placeholder="Ex: Ortodontia, Clinica Geral, Pediatria"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-extrabold uppercase tracking-widest text-slate-500 mb-1">Tipo de Registro</label>
                  <select
                    value={profissionalForm.tipo}
                    onChange={(e) => setProfissionalForm({ ...profissionalForm, tipo: e.target.value as 'CRM' | 'CRO' })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800"
                  >
                    <option value="CRM">CRM (Médico)</option>
                    <option value="CRO">CRO (Cirurgião Dentista)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold uppercase tracking-widest text-slate-500 mb-1">Numeração</label>
                  <input
                    type="text"
                    required
                    value={profissionalForm.registro}
                    onChange={(e) => setProfissionalForm({ ...profissionalForm, registro: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 font-mono"
                    placeholder="Ex: SP 123456"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowProfissionalModal(false)}
                  className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  id="btn-save-profissional"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold"
                >
                  Confirmar Cadastro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: CREATE/EDIT APPOINTMENT */}
      {showAgendamentoModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg border border-slate-200 overflow-hidden shadow-2xl">
            <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-base font-display">
                  {editingAgendamento ? 'Editar Agendamento Clínico' : 'Agendar Nova Consulta'}
                </h3>
                <p className="text-xs text-slate-400 mt-1">Garante que o paciente receba notificação de horário.</p>
              </div>
              <button 
                onClick={() => setShowAgendamentoModal(false)}
                className="text-slate-400 hover:text-white transition text-xs font-bold"
              >
                X fechar
              </button>
            </div>

            <form onSubmit={handleSaveAgendamento} className="p-6 space-y-4">
              <div className="space-y-4">
                
                {/* Paciente */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-[11px] font-extrabold uppercase tracking-widest text-slate-500">Selecionar Paciente</label>
                    <button 
                      type="button"
                      onClick={() => {
                        setShowAgendamentoModal(false);
                        openNewPaciente();
                      }}
                      className="text-[10px] text-blue-600 hover:underline font-bold"
                    >
                      + Cadastrar Novo Paciente Primeiro
                    </button>
                  </div>
                  <select
                    required
                    value={agendamentoForm.paciente_id}
                    onChange={(e) => setAgendamentoForm({ ...agendamentoForm, paciente_id: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800"
                  >
                    <option value="">Selecione o paciente cadastrado</option>
                    {pacientes.map(p => (
                      <option key={p.id} value={p.id}>{p.nome} (CPF: {p.cpf || 'Sem CPF'} - Convênio: {p.convenio})</option>
                    ))}
                  </select>
                </div>

                {/* Profissional */}
                <div>
                  <label className="block text-[11px] font-extrabold uppercase tracking-widest text-slate-500 mb-1">Profissional Responsável</label>
                  <select
                    required
                    value={agendamentoForm.profissional_id}
                    onChange={(e) => setAgendamentoForm({ ...agendamentoForm, profissional_id: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800"
                  >
                    <option value="">Selecione quem fará o atendimento</option>
                    {profissionais.map(p => (
                      <option key={p.id} value={p.id}>{p.nome} ({p.especialidade} - {p.tipo})</option>
                    ))}
                  </select>
                </div>

                {/* Data e Hora e Duração */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] font-extrabold uppercase tracking-widest text-slate-500 mb-1">Data</label>
                    <input
                      type="date"
                      required
                      value={agendamentoForm.data}
                      onChange={(e) => setAgendamentoForm({ ...agendamentoForm, data: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold uppercase tracking-widest text-slate-500 mb-1">Horário</label>
                    <select
                      value={agendamentoForm.hora}
                      onChange={(e) => setAgendamentoForm({ ...agendamentoForm, hora: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 font-mono"
                    >
                      {timeSlots.map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold uppercase tracking-widest text-slate-500 mb-1">Duração (Min)</label>
                    <select
                      value={agendamentoForm.duracao}
                      onChange={(e) => setAgendamentoForm({ ...agendamentoForm, duracao: Number(e.target.value) })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800"
                    >
                      <option value={15}>15 min</option>
                      <option value={30}>30 min</option>
                      <option value={45}>45 min</option>
                      <option value={60}>60 min</option>
                      <option value={90}>90 min</option>
                    </select>
                  </div>
                </div>

                {/* Status e Preço da consulta */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-extrabold uppercase tracking-widest text-slate-500 mb-1">Status Atendimento</label>
                    <select
                      value={agendamentoForm.status}
                      onChange={(e) => setAgendamentoForm({ ...agendamentoForm, status: e.target.value as StatusAgendamento })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800"
                    >
                      <option value="agendado">Agendado (Azul)</option>
                      <option value="confirmado">Confirmado (Verde)</option>
                      <option value="cancelado">Cancelado (Vermelho)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold uppercase tracking-widest text-slate-500 mb-1">Valor do Procedimento (R$)</label>
                    <input
                      type="number"
                      required
                      value={agendamentoForm.valor}
                      onChange={(e) => setAgendamentoForm({ ...agendamentoForm, valor: Number(e.target.value) })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 font-mono"
                      placeholder="Ex: 250"
                    />
                  </div>
                </div>

                {/* Observações adicionais */}
                <div>
                  <label className="block text-[11px] font-extrabold uppercase tracking-widest text-slate-500 mb-1">Observações / Sintomas / Recomendações</label>
                  <textarea
                    value={agendamentoForm.observacoes}
                    onChange={(e) => setAgendamentoForm({ ...agendamentoForm, observacoes: e.target.value })}
                    rows={2}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800"
                    placeholder="Escreva detalhes como: exame de canal pendente, primeira anestesia, receita médica, etc..."
                  />
                </div>

              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                {editingAgendamento ? (
                  <button
                    type="button"
                    onClick={() => handleDeleteAgendamento(editingAgendamento.id)}
                    className="text-red-650 hover:text-red-700 text-xs font-bold transition flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Excluir Agendamento
                  </button>
                ) : (
                  <div></div>
                )}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAgendamentoModal(false)}
                    className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg text-xs font-semibold"
                  >
                    Mudar Idade
                  </button>
                  <button
                    type="submit"
                    id="btn-save-agendamento"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold"
                  >
                    Confirmar Agenda
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: SUPABASE CUSTOM LINK CONFIG */}
      {showConnectionConfig && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md border border-slate-200 overflow-hidden shadow-2xl">
            <div className="p-6 bg-slate-950 text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-base font-display flex items-center gap-2">
                  <Database className="w-4 h-4 text-blue-500" />
                  Supabase Project Integration
                </h3>
                <p className="text-xs text-slate-400 mt-1">Conecte o Doctor Manager ao seu banco de dados Supabase de Produção.</p>
              </div>
              <button 
                onClick={() => setShowConnectionConfig(false)}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                X fechar
              </button>
            </div>

            <form onSubmit={handleConnectSupabase} className="p-6 space-y-4">
              <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl text-xs text-blue-900 leading-relaxed space-y-2">
                <p>
                  <strong>Pronto para produção:</strong> Para sincronizar as tabelas reais do seu escopo, execute o script SQL com as colunas mapeadas no Supabase SQL Editor:
                </p>
                <code className="block bg-slate-900 text-blue-200 text-[10px] p-2 rounded text-left overflow-x-auto font-mono">
                  clinicas, usuarios, pacientes, profissionais, agendamentos, prontuarios, financeiro
                </code>
              </div>

              <div>
                <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">SUPABASE_URL</label>
                <input
                  type="text"
                  required
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 font-mono"
                  placeholder="https://xyzcompany.supabase.co"
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">SUPABASE_ANON_KEY (Public Key)</label>
                <textarea
                  required
                  value={supabaseKey}
                  onChange={(e) => setSupabaseKey(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 font-mono"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ey..."
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setIsSupabaseConnected(false);
                    setShowConnectionConfig(false);
                  }}
                  className="px-4 py-2 text-red-650 hover:bg-slate-50 font-bold rounded-lg"
                >
                  Desconectar Supabase
                </button>
                
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs"
                >
                  Mapear Chaves Ativas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
