/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import fs from 'fs';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { Clinica, Usuario, Paciente, Profissional, Agendamento, StatusAgendamento } from './src/types';

interface Database {
  clinicas: Clinica[];
  usuarios: Usuario[];
  pacientes: Paciente[];
  profissionais: Profissional[];
  agendamentos: Agendamento[];
}

const DATA_FILE = path.join(process.cwd(), 'data.json');

// Initial seed data with today's date formatted to 2026-06-17
const INITIAL_DB: Database = {
  clinicas: [
    {
      id: "c1",
      nome: "Doctor Manager - Odontologia Especializada",
      cnpj: "12.345.678/0001-90",
      tipo: "Odontológica",
      endereco: "Av. Paulista, 1000 - Bela Vista, São Paulo - SP",
      email: "contato@sorrisoseguro.com.br",
      telefone: "(11) 3254-8900"
    },
    {
      id: "c2",
      nome: "Multiclin – Clínica Médica Integrada",
      cnpj: "98.765.432/0001-12",
      tipo: "Médica",
      endereco: "Rua das Flores, 450 - Batel, Curitiba - PR",
      email: "recepcao@multiclin.com",
      telefone: "(41) 3012-4040"
    }
  ],
  usuarios: [
    {
      id: "u1",
      nome: "Dra. Letícia Neves",
      email: "leticia@clinicasorriso.com",
      clinica_id: "c1",
      funcao: "admin"
    },
    {
      id: "u2",
      nome: "Dr. Carlos Eduardo",
      email: "carlos@multiclin.com",
      clinica_id: "c2",
      funcao: "admin"
    }
  ],
  pacientes: [
    // Clinic 1 (Dentistry)
    {
      id: "pa1",
      nome: "Ana Maria Silva",
      cpf: "123.456.789-00",
      data_nascimento: "1988-04-12",
      telefone: "(11) 98888-1111",
      email: "anamaria@email.com",
      convenio: "Bradesco Saúde",
      clinica_id: "c1"
    },
    {
      id: "pa2",
      nome: "João Pedro Santos",
      cpf: "234.567.890-11",
      data_nascimento: "1995-10-23",
      telefone: "(11) 97777-2222",
      email: "joao.pedro@email.com",
      convenio: "Particular",
      clinica_id: "c1"
    },
    {
      id: "pa3",
      nome: "Mariana Costa",
      cpf: "345.678.901-22",
      data_nascimento: "2002-07-05",
      telefone: "(11) 96666-3333",
      email: "mari.costa@email.com",
      convenio: "Amil Dental",
      clinica_id: "c1"
    },
    // Clinic 2 (Medical)
    {
      id: "pa4",
      nome: "Carlos Augusto Lima",
      cpf: "456.789.012-33",
      data_nascimento: "1964-02-14",
      telefone: "(41) 99999-4444",
      email: "carlos.lima@email.com",
      convenio: "Unimed",
      clinica_id: "c2"
    },
    {
      id: "pa5",
      nome: "Juliana Mendes Melo",
      cpf: "567.890.123-44",
      data_nascimento: "1991-11-30",
      telefone: "(41) 98888-5555",
      email: "ju.mendes@email.com",
      convenio: "Amil",
      clinica_id: "c2"
    },
    {
      id: "pa6",
      nome: "Roberto Gomes Ramos",
      cpf: "678.901.234-55",
      data_nascimento: "1978-08-19",
      telefone: "(41) 97777-6666",
      email: "roberto.gomes@email.com",
      convenio: "Particular",
      clinica_id: "c2"
    }
  ],
  profissionais: [
    // Clinic 1 (Dentistry)
    {
      id: "p1",
      nome: "Dra. Letícia Neves",
      especialidade: "Dentística & Estética",
      registro: "CRO-SP 123456",
      tipo: "CRO",
      clinica_id: "c1"
    },
    {
      id: "p2",
      nome: "Dr. Roberto Dias",
      especialidade: "Ortodontia",
      registro: "CRO-SP 789012",
      tipo: "CRO",
      clinica_id: "c1"
    },
    // Clinic 2 (Medical)
    {
      id: "p3",
      nome: "Dr. Carlos Eduardo",
      especialidade: "Cardiologia",
      registro: "CRM-SP 654321",
      tipo: "CRM",
      clinica_id: "c2"
    },
    {
      id: "p4",
      nome: "Dra. Sandra Regina",
      especialidade: "Pediatria Geral",
      registro: "CRM-SP 987654",
      tipo: "CRM",
      clinica_id: "c2"
    }
  ],
  agendamentos: [
    // Clinic 1 (Dentistry) - Scheduled for 2026-06-17 (today)
    {
      id: "a1",
      paciente_id: "pa1",
      profissional_id: "p1",
      data_hora: "2026-06-17T09:00",
      duracao: 30,
      status: "confirmado",
      observacoes: "Limpeza de rotina e profilaxia",
      clinica_id: "c1",
      valor: 150
    },
    {
      id: "a2",
      paciente_id: "pa2",
      profissional_id: "p2",
      data_hora: "2026-06-17T11:00",
      duracao: 60,
      status: "confirmado",
      observacoes: "Manutenção mensal do aparelho ortodôntico",
      clinica_id: "c1",
      valor: 200
    },
    {
      id: "a3",
      paciente_id: "pa3",
      profissional_id: "p1",
      data_hora: "2026-06-17T14:30",
      duracao: 45,
      status: "agendado",
      observacoes: "Avaliação inicial para tratamento de canal",
      clinica_id: "c1",
      valor: 350
    },
    {
      id: "a4",
      paciente_id: "pa1",
      profissional_id: "p2",
      data_hora: "2026-06-17T16:00",
      duracao: 30,
      status: "cancelado",
      observacoes: "Paciente cancelou por imprevisto de trabalho",
      clinica_id: "c1",
      valor: 0
    },
    // Clinic 2 (Medical) - Scheduled for 2026-06-17 (today)
    {
      id: "a5",
      paciente_id: "pa4",
      profissional_id: "p3",
      data_hora: "2026-06-17T08:30",
      duracao: 30,
      status: "confirmado",
      observacoes: "Retorno pós-exames eletrocardiograma",
      clinica_id: "c2",
      valor: 250
    },
    {
      id: "a6",
      paciente_id: "pa5",
      profissional_id: "p4",
      data_hora: "2026-06-17T10:00",
      duracao: 45,
      status: "agendado",
      observacoes: "Consulta pediátrica de desenvolvimento anual",
      clinica_id: "c2",
      valor: 300
    },
    {
      id: "a7",
      paciente_id: "pa6",
      profissional_id: "p3",
      data_hora: "2026-06-17T13:00",
      duracao: 30,
      status: "confirmado",
      observacoes: "Controle de hipertensão arterial",
      clinica_id: "c2",
      valor: 250
    },
    {
      id: "a8",
      paciente_id: "pa5",
      profissional_id: "p4",
      data_hora: "2026-06-17T15:30",
      duracao: 30,
      status: "cancelado",
      observacoes: "Sintomas gripais - remarcou para próxima semana",
      clinica_id: "c2",
      valor: 0
    }
  ]
};

// Helper function to read database files
function getDB(): Database {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify(INITIAL_DB, null, 2), 'utf-8');
      return INITIAL_DB;
    }
    const content = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    console.error("Error reading database file, using in-memory database:", err);
    return INITIAL_DB;
  }
}

// Helper function to save database files
function saveDB(db: Database) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error("Error writing database file:", err);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Middleware for simple Bearer clinic-id tracking
  // To avoid complex auth we pass clinic-id header or auth header
  const getClinicId = (req: express.Request): string => {
    const xClinicId = req.headers['x-clinic-id'];
    if (typeof xClinicId === 'string' && xClinicId) {
      return xClinicId;
    }
    return "c1"; // default fallback for safety
  };

  // 1. Auth & Clinics
  app.get('/api/clinicas', (req, res) => {
    const db = getDB();
    res.json(db.clinicas);
  });

  app.post('/api/auth/check-email', (req, res) => {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "E-mail é obrigatório" });
    }
    const db = getDB();
    const cleanEmail = email.toString().toLowerCase().trim();
    
    // Find all users with this email (they can be registered in multiple clinics)
    const matchingUsers = db.usuarios.filter(u => u.email.toLowerCase() === cleanEmail);
    
    // Get corresponding clinics
    const clinics = matchingUsers
      .map(u => db.clinicas.find(c => c.id === u.clinica_id))
      .filter((c): c is Clinica => !!c);
    
    if (clinics.length > 0) {
      res.json({ userExists: true, clinics });
    } else {
      // If the email is new, let them choose from all available clinics to register in
      res.json({ userExists: false, clinics: db.clinicas });
    }
  });

  app.post('/api/auth/login', (req, res) => {
    const { email, clinicId } = req.body;
    if (!email) {
      return res.status(400).json({ error: "E-mail é obrigatório" });
    }
    if (!clinicId) {
      return res.status(400).json({ error: "ID da clínica é obrigatório" });
    }
    const db = getDB();
    const cleanEmail = email.toString().toLowerCase().trim();
    
    // Find matching user with this email in the specified clinic
    let user = db.usuarios.find(u => u.email.toLowerCase() === cleanEmail && u.clinica_id === clinicId);
    
    if (!user) {
      // If user exists with this email but in another clinic, let's copy/create a profile for them in this selected clinic
      const existingUserAnywhere = db.usuarios.find(u => u.email.toLowerCase() === cleanEmail);
      const name = existingUserAnywhere ? existingUserAnywhere.nome : cleanEmail.split('@')[0].toUpperCase();
      
      user = {
        id: "u_" + Math.random().toString(36).substr(2, 9),
        nome: name,
        email: cleanEmail,
        clinica_id: clinicId,
        funcao: "admin"
      };
      db.usuarios.push(user);
      saveDB(db);
    }

    // Find the linked clinic
    const clinic = db.clinicas.find(c => c.id === clinicId);
    if (!clinic) {
      return res.status(404).json({ error: "Clínica selecionada não foi encontrada" });
    }

    res.json({ user, clinic });
  });

  // 2. Dashboard Stats
  app.get('/api/dashboard', (req, res) => {
    const clinicId = getClinicId(req);
    const db = getDB();
    
    // Filter scheduled appointments for today: 2026-06-17
    const todayPrefix = "2026-06-17";
    const appointmentsToday = db.agendamentos.filter(a => 
      a.clinica_id === clinicId && 
      a.data_hora.startsWith(todayPrefix)
    );

    const totalAgendamentos = appointmentsToday.length;
    const confirmados = appointmentsToday.filter(a => a.status === 'confirmado').length;
    const cancelados = appointmentsToday.filter(a => a.status === 'cancelado').length;
    const agendados = appointmentsToday.filter(a => a.status === 'agendado').length;

    // Sum of confirmed appointments
    const receitaDoDia = appointmentsToday
      .filter(a => a.status === 'confirmado')
      .reduce((sum, a) => sum + (a.valor || 0), 0);

    res.json({
      totalAgendamentos,
      confirmados,
      cancelados,
      agendados,
      receitaDoDia,
      hojeStr: "17 de Junho de 2026"
    });
  });

  // 3. Patients (Pacientes) CRUD
  app.get('/api/pacientes', (req, res) => {
    const clinicId = getClinicId(req);
    const db = getDB();
    const list = db.pacientes.filter(p => p.clinica_id === clinicId);
    res.json(list);
  });

  app.post('/api/pacientes', (req, res) => {
    const clinicId = getClinicId(req);
    const { nome, cpf, data_nascimento, telefone, email, convenio } = req.body;
    
    if (!nome) {
      return res.status(400).json({ error: "Nome do paciente é obrigatório" });
    }

    const db = getDB();
    const newPaciente: Paciente = {
      id: "pa_" + Math.random().toString(36).substr(2, 9),
      nome,
      cpf: cpf || "",
      data_nascimento: data_nascimento || "",
      telefone: telefone || "",
      email: email || "",
      convenio: convenio || "Particular",
      clinica_id: clinicId
    };

    db.pacientes.push(newPaciente);
    saveDB(db);
    res.status(201).json(newPaciente);
  });

  app.put('/api/pacientes/:id', (req, res) => {
    const { id } = req.params;
    const clinicId = getClinicId(req);
    const { nome, cpf, data_nascimento, telefone, email, convenio } = req.body;

    const db = getDB();
    const index = db.pacientes.findIndex(p => p.id === id && p.clinica_id === clinicId);
    if (index === -1) {
      return res.status(404).json({ error: "Paciente não encontrado" });
    }

    db.pacientes[index] = {
      ...db.pacientes[index],
      nome: nome !== undefined ? nome : db.pacientes[index].nome,
      cpf: cpf !== undefined ? cpf : db.pacientes[index].cpf,
      data_nascimento: data_nascimento !== undefined ? data_nascimento : db.pacientes[index].data_nascimento,
      telefone: telefone !== undefined ? telefone : db.pacientes[index].telefone,
      email: email !== undefined ? email : db.pacientes[index].email,
      convenio: convenio !== undefined ? convenio : db.pacientes[index].convenio,
    };

    saveDB(db);
    res.json(db.pacientes[index]);
  });

  app.delete('/api/pacientes/:id', (req, res) => {
    const { id } = req.params;
    const clinicId = getClinicId(req);

    const db = getDB();
    const originalLength = db.pacientes.length;
    db.pacientes = db.pacientes.filter(p => !(p.id === id && p.clinica_id === clinicId));

    if (db.pacientes.length === originalLength) {
      return res.status(404).json({ error: "Paciente não encontrado" });
    }

    // Also remove related appointments
    db.agendamentos = db.agendamentos.filter(a => !(a.paciente_id === id && a.clinica_id === clinicId));

    saveDB(db);
    res.json({ success: true });
  });

  // 4. Professionals (Profissionais) CRUD
  app.get('/api/profissionais', (req, res) => {
    const clinicId = getClinicId(req);
    const db = getDB();
    const list = db.profissionais.filter(p => p.clinica_id === clinicId);
    res.json(list);
  });

  app.post('/api/profissionais', (req, res) => {
    const clinicId = getClinicId(req);
    const { nome, especialidade, registro, tipo } = req.body;

    if (!nome || !especialidade || !registro) {
      return res.status(400).json({ error: "Nome, Especialidade e Registro são obrigatórios" });
    }

    const db = getDB();
    const newProfissional: Profissional = {
      id: "p_" + Math.random().toString(36).substr(2, 9),
      nome,
      especialidade,
      registro,
      tipo: tipo || (getDB().clinicas.find(c => c.id === clinicId)?.tipo === 'Médica' ? 'CRM' : 'CRO'),
      clinica_id: clinicId
    };

    db.profissionais.push(newProfissional);
    saveDB(db);
    res.status(201).json(newProfissional);
  });

  app.put('/api/profissionais/:id', (req, res) => {
    const { id } = req.params;
    const clinicId = getClinicId(req);
    const { nome, especialidade, registro, tipo } = req.body;

    const db = getDB();
    const index = db.profissionais.findIndex(p => p.id === id && p.clinica_id === clinicId);
    if (index === -1) {
      return res.status(404).json({ error: "Profissional não encontrado" });
    }

    db.profissionais[index] = {
      ...db.profissionais[index],
      nome: nome !== undefined ? nome : db.profissionais[index].nome,
      especialidade: especialidade !== undefined ? especialidade : db.profissionais[index].especialidade,
      registro: registro !== undefined ? registro : db.profissionais[index].registro,
      tipo: tipo !== undefined ? tipo : db.profissionais[index].tipo,
    };

    saveDB(db);
    res.json(db.profissionais[index]);
  });

  app.delete('/api/profissionais/:id', (req, res) => {
    const { id } = req.params;
    const clinicId = getClinicId(req);

    const db = getDB();
    const originalLength = db.profissionais.length;
    db.profissionais = db.profissionais.filter(p => !(p.id === id && p.clinica_id === clinicId));

    if (db.profissionais.length === originalLength) {
      return res.status(404).json({ error: "Profissional não encontrado" });
    }

    // Also remove related appointments
    db.agendamentos = db.agendamentos.filter(a => !(a.profissional_id === id && a.clinica_id === clinicId));

    saveDB(db);
    res.json({ success: true });
  });

  // 5. Appointments (Agendamentos) CRUD
  app.get('/api/agendamentos', (req, res) => {
    const clinicId = getClinicId(req);
    const db = getDB();
    const list = db.agendamentos.filter(a => a.clinica_id === clinicId);
    
    // Embed information of patients and professionals
    const detailed = list.map(a => {
      const paciente = db.pacientes.find(p => p.id === a.paciente_id);
      const profissional = db.profissionais.find(p => p.id === a.profissional_id);
      return {
        ...a,
        paciente,
        profissional
      };
    });

    res.json(detailed);
  });

  app.post('/api/agendamentos', (req, res) => {
    const clinicId = getClinicId(req);
    const { paciente_id, profissional_id, data_hora, duracao, status, observacoes, valor } = req.body;

    if (!paciente_id || !profissional_id || !data_hora) {
      return res.status(400).json({ error: "Paciente, profissional e data/hora são obrigatórios" });
    }

    const db = getDB();
    // Default price based on professional if not provided
    const val = valor !== undefined ? Number(valor) : (db.clinicas.find(c => c.id === clinicId)?.tipo === 'Médica' ? 250 : 150);

    const newAgendamento: Agendamento = {
      id: "a_" + Math.random().toString(36).substr(2, 9),
      paciente_id,
      profissional_id,
      data_hora, // ISO formats
      duracao: Number(duracao) || 30,
      status: (status as StatusAgendamento) || "agendado",
      observacoes: observacoes || "",
      clinica_id: clinicId,
      valor: val
    };

    db.agendamentos.push(newAgendamento);
    saveDB(db);

    // return detailed
    const paciente = db.pacientes.find(p => p.id === paciente_id);
    const profissional = db.profissionais.find(p => p.id === profissional_id);

    res.status(201).json({
      ...newAgendamento,
      paciente,
      profissional
    });
  });

  app.put('/api/agendamentos/:id', (req, res) => {
    const { id } = req.params;
    const clinicId = getClinicId(req);
    const { paciente_id, profissional_id, data_hora, duracao, status, observacoes, valor } = req.body;

    const db = getDB();
    const index = db.agendamentos.findIndex(a => a.id === id && a.clinica_id === clinicId);
    if (index === -1) {
      return res.status(404).json({ error: "Agendamento não encontrado" });
    }

    db.agendamentos[index] = {
      ...db.agendamentos[index],
      paciente_id: paciente_id !== undefined ? paciente_id : db.agendamentos[index].paciente_id,
      profissional_id: profissional_id !== undefined ? profissional_id : db.agendamentos[index].profissional_id,
      data_hora: data_hora !== undefined ? data_hora : db.agendamentos[index].data_hora,
      duracao: duracao !== undefined ? Number(duracao) : db.agendamentos[index].duracao,
      status: status !== undefined ? (status as StatusAgendamento) : db.agendamentos[index].status,
      observacoes: observacoes !== undefined ? observacoes : db.agendamentos[index].observacoes,
      valor: valor !== undefined ? Number(valor) : db.agendamentos[index].valor,
    };

    saveDB(db);

    const paciente = db.pacientes.find(p => p.id === db.agendamentos[index].paciente_id);
    const profesional = db.profissionais.find(p => p.id === db.agendamentos[index].profissional_id);

    res.json({
      ...db.agendamentos[index],
      paciente,
      profissional: profesional
    });
  });

  app.delete('/api/agendamentos/:id', (req, res) => {
    const { id } = req.params;
    const clinicId = getClinicId(req);

    const db = getDB();
    const originalLength = db.agendamentos.length;
    db.agendamentos = db.agendamentos.filter(a => !(a.id === id && a.clinica_id === clinicId));

    if (db.agendamentos.length === originalLength) {
      return res.status(404).json({ error: "Agendamento não encontrado" });
    }

    saveDB(db);
    res.json({ success: true });
  });

  // Serve static assets in production, and mount Vite in development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: express.Request, res: express.Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`DOCTOR MANAGER is running on port ${PORT}`);
  });
}

startServer();
