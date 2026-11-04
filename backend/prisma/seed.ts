import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { PrismaClient, Role, Taskgroup, WalletType, TimelineCategory, CalendarCategory } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://yme_user:yme_password_secure@localhost:5432/yme_portal_db?schema=public',
    },
  },
});

// Minimal valid PDF binary content for seed demo reports
const minimalPdfContent = `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>endobj
xref
0 4
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
trailer<</Size 4/Root 1 0 R>>
startxref
190
%%EOF`;

async function main() {
  console.log('🌱 Starting YME Portal database seeding with official Executive Board, Taskgroups & SAD Scores (0-6 scale)...');

  // Skip seeding if database already has users
  const userCount = await prisma.user.count();
  if (userCount > 0) {
    console.log(`ℹ️ Database already has ${userCount} users. Skipping seed to preserve data.`);
    return;
  }

  // Ensure uploads/sad directory exists
  const uploadsDir = path.resolve(__dirname, '../uploads/sad');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Create sample PDF files for demonstration
  const samplePdfs = [
    'sad_2024_2025_q1_tiago_silva.pdf',
    'sad_2024_2025_q2_tiago_silva.pdf',
    'sad_2024_2025_q3_tiago_silva.pdf',
    'sad_2024_2025_q4_tiago_silva.pdf',
    'sad_2025_2026_q1_tiago_silva.pdf',
  ];

  for (const pdfName of samplePdfs) {
    fs.writeFileSync(path.join(uploadsDir, pdfName), minimalPdfContent);
  }

  // Clean up existing data
  await prisma.walletTransaction.deleteMany();
  await prisma.evaluationSAD.deleteMany();
  await prisma.timelineEvent.deleteMany();
  await prisma.calendarEvent.deleteMany();
  await prisma.user.deleteMany();
  await prisma.department.deleteMany();

  console.log('🧹 Cleaned existing database records.');

  // 1. Create the Official 6 Departments
  const brandDept = await prisma.department.create({
    data: { name: 'Brand Strategy' },
  });
  const digitalDept = await prisma.department.create({
    data: { name: 'Digital Development' },
  });
  const hrDept = await prisma.department.create({
    data: { name: 'Human Resources' },
  });
  const legalDept = await prisma.department.create({
    data: { name: 'Legal & Finance' },
  });
  const qualityDept = await prisma.department.create({
    data: { name: 'Quality Management' },
  });
  const salesDept = await prisma.department.create({
    data: { name: 'Sales & Commercial' },
  });

  console.log('🏢 Official Departments created (Brand, Digital, HR, Legal & Finance, Quality, Sales).');

  // 2. Hash default password
  const passwordHash = await bcrypt.hash('password123', 10);

  // 3. Create the 3 Executive Board Members (All are ADMIN)
  const presidentAdmin = await prisma.user.create({
    data: {
      email: 'admin@yme.pt',
      passwordHash,
      fullName: 'Rodrigo Antunes',
      role: Role.ADMIN,
      departmentId: digitalDept.id,
      position: 'Head',
      taskgroups: [Taskgroup.CSR, Taskgroup.PARTNERSHIPS],
      isActive: true,
    },
  });

  const vpAdmin = await prisma.user.create({
    data: {
      email: 'vp@yme.pt',
      passwordHash,
      fullName: 'Inês Duarte',
      role: Role.ADMIN,
      departmentId: brandDept.id,
      position: 'Head',
      taskgroups: [],
      isActive: true,
    },
  });

  const execAdmin = await prisma.user.create({
    data: {
      email: 'exec@yme.pt',
      passwordHash,
      fullName: 'Afonso Henriques',
      role: Role.ADMIN,
      departmentId: qualityDept.id,
      position: 'Head',
      taskgroups: [],
      isActive: true,
    },
  });

  console.log('👑 Executive Board Admins created (3 Admins).');

  // 4. Create Human Resources Members (Authorized for SAD + HR_ACTIVITY)
  const hrManager = await prisma.user.create({
    data: {
      email: 'hr.manager@yme.pt',
      passwordHash,
      fullName: 'Marta Ribeiro',
      role: Role.DIRECTOR,
      departmentId: hrDept.id,
      position: 'Manager',
      taskgroups: [],
      isActive: true,
    },
  });

  const hrConsultant = await prisma.user.create({
    data: {
      email: 'hr.consultant@yme.pt',
      passwordHash,
      fullName: 'Tiago Ferreira',
      role: Role.MEMBER,
      departmentId: hrDept.id,
      position: 'Senior Consultant',
      taskgroups: [Taskgroup.PARTNERSHIPS],
      isActive: true,
    },
  });

  // 5. Create Legal & Finance Members (Head & Manager authorized for Wallet)
  const legalHead = await prisma.user.create({
    data: {
      email: 'legal.head@yme.pt',
      passwordHash,
      fullName: 'Diogo Fonseca',
      role: Role.DIRECTOR,
      departmentId: legalDept.id,
      position: 'Head',
      taskgroups: [],
      isActive: true,
    },
  });

  const legalManager = await prisma.user.create({
    data: {
      email: 'legal.manager@yme.pt',
      passwordHash,
      fullName: 'Camila Neves',
      role: Role.MEMBER,
      departmentId: legalDept.id,
      position: 'Manager',
      taskgroups: [],
      isActive: true,
    },
  });

  // 6. Create Digital Development, Sales & Trainee Members
  const memberUser = await prisma.user.create({
    data: {
      email: 'member@yme.pt',
      passwordHash,
      fullName: 'Tiago Silva',
      role: Role.MEMBER,
      departmentId: digitalDept.id,
      position: 'Senior Consultant',
      taskgroups: [Taskgroup.CSR],
      isActive: true,
    },
  });

  const salesHead = await prisma.user.create({
    data: {
      email: 'sales.head@yme.pt',
      passwordHash,
      fullName: 'Gonçalo Ramos',
      role: Role.DIRECTOR,
      departmentId: salesDept.id,
      position: 'Head',
      taskgroups: [Taskgroup.PARTNERSHIPS],
      isActive: true,
    },
  });

  const traineeUser = await prisma.user.create({
    data: {
      email: 'trainee@yme.pt',
      passwordHash,
      fullName: 'Beatriz Santos',
      role: Role.MEMBER,
      departmentId: brandDept.id,
      position: 'Trainee',
      taskgroups: [Taskgroup.CSR],
      isActive: true,
    },
  });

  console.log('👥 Team Members created across all 6 departments and taskgroups.');

  // 7. Create SAD Evaluations for Tiago Silva (0 to 6 Scale)
  const sadData = [
    {
      userId: memberUser.id,
      term: '2024/2025 - Q1',
      score: 4.85,
      reportPdfUrl: '/uploads/sad/sad_2024_2025_q1_tiago_silva.pdf',
      feedbackNotes:
        'Excelente integração no departamento de Digital Development. Demonstrou autonomia na refatoração da stack interna e proatividade em propor melhorias na arquitetura.',
    },
    {
      userId: memberUser.id,
      term: '2024/2025 - Q2',
      score: 5.10,
      reportPdfUrl: '/uploads/sad/sad_2024_2025_q2_tiago_silva.pdf',
      feedbackNotes:
        'Grande evolução na comunicação inter-departamental. Entregou o módulo de gestão com zero bloqueios críticos.',
    },
    {
      userId: memberUser.id,
      term: '2024/2025 - Q3',
      score: 5.35,
      reportPdfUrl: '/uploads/sad/sad_2024_2025_q3_tiago_silva.pdf',
      feedbackNotes:
        'Liderou com brio o task group de infraestrutura e DevOps. Capacidade de mentoria para novos trainees altamente elogiada pelos Recursos Humanos.',
    },
    {
      userId: memberUser.id,
      term: '2024/2025 - Q4',
      score: 5.60,
      reportPdfUrl: '/uploads/sad/sad_2024_2025_q4_tiago_silva.pdf',
      feedbackNotes:
        'Desempenho exemplar no fecho do mandato. Consistência técnica e forte alinhamento com a visão estratégica da Executive Board.',
    },
    {
      userId: memberUser.id,
      term: '2025/2026 - Q1',
      score: 5.80,
      reportPdfUrl: '/uploads/sad/sad_2025_2026_q1_tiago_silva.pdf',
      feedbackNotes:
        'Início de mandato estelar como Senior Consultant em Digital Development. Papel fundamental no lançamento da nova YME APP.',
    },
  ];

  for (const item of sadData) {
    await prisma.evaluationSAD.create({ data: item });
  }

  // 8. Create Wallet Transactions for Tiago Silva
  const walletTransactions = [
    {
      userId: memberUser.id,
      amount: 25.0,
      type: WalletType.SAD_REWARD,
      description: 'Prémio SAD 2024/2025 Q1 - Top Performer Digital Dev',
      createdAt: new Date('2024-11-15T10:00:00Z'),
    },
    {
      userId: memberUser.id,
      amount: 10.0,
      type: WalletType.PRESENCE_BONUS,
      description: 'Bónus de assiduidade e pontualidade em Reuniões Gerais',
      createdAt: new Date('2024-12-01T14:30:00Z'),
    },
    {
      userId: memberUser.id,
      amount: -15.0,
      type: WalletType.EVENT_SPEND,
      description: 'Inscrição no Encontro Nacional de Juniores Empresas (ENJE)',
      createdAt: new Date('2025-01-20T09:15:00Z'),
    },
    {
      userId: memberUser.id,
      amount: 30.0,
      type: WalletType.SAD_REWARD,
      description: 'Prémio SAD 2024/2025 Q2 - Excelência de Desempenho',
      createdAt: new Date('2025-02-28T18:00:00Z'),
    },
    {
      userId: memberUser.id,
      amount: 5.0,
      type: WalletType.ADJUSTMENT,
      description: 'Crédito de suporte a formação interna de NestJS/React',
      createdAt: new Date('2025-03-10T11:20:00Z'),
    },
    {
      userId: memberUser.id,
      amount: -20.0,
      type: WalletType.EVENT_SPEND,
      description: 'Jantar de Gala e Comemoração do Aniversário YME',
      createdAt: new Date('2025-04-12T20:00:00Z'),
    },
    {
      userId: memberUser.id,
      amount: 35.0,
      type: WalletType.SAD_REWARD,
      description: 'Prémio SAD 2024/2025 Q3 - Top 5 Global da Associação',
      createdAt: new Date('2025-05-30T17:45:00Z'),
    },
    {
      userId: memberUser.id,
      amount: 15.0,
      type: WalletType.PRESENCE_BONUS,
      description: 'Facilitação de 3 workshops práticos de Git & Docker',
      createdAt: new Date('2025-06-18T16:00:00Z'),
    },
    {
      userId: memberUser.id,
      amount: -12.5,
      type: WalletType.EVENT_SPEND,
      description: 'Merchandising Oficial YME - Hoodie Exclusivo de Consultor',
      createdAt: new Date('2025-07-05T12:00:00Z'),
    },
    {
      userId: memberUser.id,
      amount: 40.0,
      type: WalletType.SAD_REWARD,
      description: 'Prémio SAD 2024/2025 Q4 - Reconhecimento de Mérito Global',
      createdAt: new Date('2025-08-01T15:30:00Z'),
    },
  ];

  for (const tx of walletTransactions) {
    await prisma.walletTransaction.create({ data: tx });
  }

  // 9. Create Timeline Events for Tiago Silva
  const timelineEvents = [
    {
      userId: memberUser.id,
      title: 'Recrutamento & Entrada na YME',
      category: TimelineCategory.RECRUITMENT,
      description:
        'Admissão com distinção no processo de recrutamento de outono no departamento de Digital Development.',
      eventDate: new Date('2024-09-15T09:00:00Z'),
    },
    {
      userId: memberUser.id,
      title: 'Bootcamp de Clean Architecture & Full-Stack',
      category: TimelineCategory.FORMATION,
      description:
        'Conclusão de formação intensiva de 24 horas sobre Clean Architecture, React, Node.js, Prisma e Docker.',
      eventDate: new Date('2024-10-20T18:00:00Z'),
    },
    {
      userId: memberUser.id,
      title: 'Alocação ao Projeto Portal de Clientes v2',
      category: TimelineCategory.PROJECT,
      description:
        'Nomeação como Full-Stack Developer responsável pelo desenvolvimento de APIs REST seguras e integração com React.',
      eventDate: new Date('2024-12-10T10:00:00Z'),
    },
    {
      userId: memberUser.id,
      title: 'Promoção a Senior Consultant',
      category: TimelineCategory.AWARD,
      description:
        'Reconhecimento pela Executive Board e transição para o cargo de Senior Consultant no departamento de Digital Development.',
      eventDate: new Date('2025-03-01T14:30:00Z'),
    },
    {
      userId: memberUser.id,
      title: 'Tech Lead na YME APP 2026',
      category: TimelineCategory.PROJECT,
      description:
        'Liderança técnica e arquitetural da plataforma interna mobile-first para gestão de SAD, Carteira e Calendário.',
      eventDate: new Date('2025-09-01T09:00:00Z'),
    },
  ];

  for (const event of timelineEvents) {
    await prisma.timelineEvent.create({ data: event });
  }

  // 10. Create Calendar Events
  const calendarEvents = [
    {
      title: 'Assembleia Geral Ordinária - Plano Estratégico',
      category: CalendarCategory.GENERAL_ASSEMBLY,
      description:
        'Apresentação dos resultados consolidados pela Executive Board, balanço financeiro e votação do plano de atividades.',
      startTime: new Date('2026-09-10T18:30:00Z'),
      endTime: new Date('2026-09-10T21:30:00Z'),
      location: 'Auditório Principal / Sala 2.04 & Zoom',
    },
    {
      title: 'Workshop: Masterclass de Negociação & Pitching Comercial',
      category: CalendarCategory.FORMATION,
      description:
        'Sessão prática dinamizada por Sales & Commercial sobre técnicas de negociação de propostas e fecho de contratos.',
      startTime: new Date('2026-09-15T14:00:00Z'),
      endTime: new Date('2026-09-15T17:30:00Z'),
      location: 'Espaço Inovação YME / Sala B',
    },
    {
      title: 'Ação Solidária: Recolha e Apoio Comunitário (Taskgroup CSR)',
      category: CalendarCategory.CSR_ACTIVITY,
      description:
        'Iniciativa de Responsabilidade Social Corporativa dinamizada pelo Taskgroup de CSR da YME junto de instituições locais.',
      startTime: new Date('2026-09-20T09:30:00Z'),
      endTime: new Date('2026-09-20T16:00:00Z'),
      location: 'Centro Comunitário / Porto',
    },
    {
      title: 'YME Open Day & Mostra de Parceiros 2026',
      category: CalendarCategory.OPEN_DAY,
      description:
        'Evento aberto a empresas parceiras, alumni e novos candidatos para apresentação de projetos e oportunidades de consultoria.',
      startTime: new Date('2026-09-25T10:00:00Z'),
      endTime: new Date('2026-09-25T18:00:00Z'),
      location: 'Átrio Central da Faculdade / Stand YME',
    },
    {
      title: 'Dinâmica de Integração & Onboarding RH (Recursos Humanos)',
      category: CalendarCategory.HR_ACTIVITY,
      description:
        'Sessão de acompanhamento mensal promovida pela equipa de Recursos Humanos para partilha de feedback e acompanhamento de planos de desenvolvimento.',
      startTime: new Date('2026-09-28T17:00:00Z'),
      endTime: new Date('2026-09-28T19:00:00Z'),
      location: 'Sala Multiusos YME',
    },
    {
      title: 'Submissão de Relatórios de Autoavaliação SAD Q1',
      category: CalendarCategory.DEADLINE,
      description:
        'Data limite improrrogável para submissão dos formulários de autoavaliação por todos os membros ativos.',
      startTime: new Date('2026-09-30T23:59:00Z'),
      endTime: new Date('2026-09-30T23:59:00Z'),
      location: 'YME APP - Módulo SAD',
    },
  ];

  for (const calEvent of calendarEvents) {
    await prisma.calendarEvent.create({ data: calEvent });
  }

  console.log('📅 Calendar Events created across all categories.');
  console.log('✅ YME Portal database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
