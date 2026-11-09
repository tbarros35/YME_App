import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import {
  PrismaClient,
  Role,
  WalletType,
  TimelineCategory,
  CalendarCategory,
} from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url:
        process.env.DATABASE_URL ||
        'postgresql://yme_user:yme_password_secure@localhost:5432/yme_portal_db?schema=public',
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

const OFFICIAL_DEPARTMENTS = [
  'Executive Board',
  'Brand Strategy',
  'Digital Development',
  'Human Resources',
  'Legal & Finance',
  'Quality Management',
  'Sales & Commercial',
] as const;

async function main() {
  const isProduction = process.env.NODE_ENV === 'production';
  console.log(`🌱 A iniciar o povoamento da base de dados YME Portal (Modo: ${isProduction ? 'PRODUÇÃO' : 'DESENVOLVIMENTO'})...`);

  // Ensure uploads directories exist
  const uploadsSadDir = path.resolve(__dirname, '../uploads/sad');
  const uploadsReimbursementsDir = path.resolve(__dirname, '../uploads/reimbursements');
  const uploadsProofsDir = path.resolve(__dirname, '../uploads/reimbursement_proofs');

  for (const dir of [uploadsSadDir, uploadsReimbursementsDir, uploadsProofsDir]) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  // 1. Criar ou garantir os Departamentos Oficiais da YME (incluindo Executive Board)
  console.log('🏢 A verificar departamentos oficiais...');
  const departmentMap: Record<string, string> = {};

  for (const deptName of OFFICIAL_DEPARTMENTS) {
    let dept = await prisma.department.findUnique({
      where: { name: deptName },
    });

    if (!dept) {
      dept = await prisma.department.create({
        data: { name: deptName },
      });
      console.log(`  ➕ Criado departamento: ${deptName}`);
    } else {
      console.log(`  ✓ Departamento existente: ${deptName}`);
    }
    departmentMap[deptName] = dept.id;
  }

  // 1.1 Criar ou garantir Taskgroups Oficiais
  console.log('🌱 A verificar taskgroups oficiais...');
  const INITIAL_TASKGROUPS = ['CSR', 'Partnerships', 'Hive', 'Concerto Solidário'];
  for (const tgName of INITIAL_TASKGROUPS) {
    const existing = await prisma.taskgroup.findUnique({
      where: { name: tgName },
    });
    if (!existing) {
      await prisma.taskgroup.create({
        data: { name: tgName },
      });
      console.log(`  ➕ Criada taskgroup: ${tgName}`);
    } else {
      console.log(`  ✓ Taskgroup existente: ${tgName}`);
    }
  }

  // 2. Criar ou garantir Conta de Administrador Principal (Executive Board - CEO)
  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@yme.pt';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'password123';
  const adminName = process.env.SEED_ADMIN_NAME || 'Rodrigo Antunes';

  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash,
        fullName: adminName,
        role: Role.ADMIN,
        departmentId: departmentMap['Executive Board'],
        position: 'CEO',
        taskgroups: ['CSR', 'Partnerships'],
        careerHistory: [
          'Trainee of Brand Strategy',
          'Junior Consultant of Brand Strategy',
          'Head of Brand Strategy',
          'CEO',
        ],
        isActive: true,
        mustChangePassword: false,
      },
    });
    console.log(`👑 Conta Administrador Principal (CEO - Executive Board) criada: ${adminEmail}`);
  } else {
    // Atualizar departamento e cargo se necessário
    await prisma.user.update({
      where: { email: adminEmail },
      data: {
        departmentId: departmentMap['Executive Board'],
        position: 'CEO',
        mustChangePassword: false,
        role: Role.ADMIN,
      },
    });
    console.log(`✓ Conta Administrador Principal atualizada para Executive Board (CEO): ${adminEmail}`);
  }

  // Se estivermos em PRODUÇÃO, terminamos aqui para manter a base de dados limpa
  if (isProduction) {
    console.log('🛡️ Modo de Produção: Estrutura base e conta de Direção criadas. Dados de teste ignorados.');
    console.log('✅ Base de dados de produção pronta para uso!');
    return;
  }

  // ==============================================================================
  // DADOS DE DEMONSTRAÇÃO E TESTE (APENAS AMBIENTE DE DESENVOLVIMENTO)
  // ==============================================================================
  console.log('📦 A carregar dados de demonstração (membros de teste, avaliações SAD, carteira e calendário)...');

  // Criar ficheiros PDF de exemplo para relatórios SAD
  const samplePdfs = [
    'sad_2024_2025_q1_tiago_silva.pdf',
    'sad_2024_2025_q2_tiago_silva.pdf',
    'sad_2024_2025_q3_tiago_silva.pdf',
    'sad_2024_2025_q4_tiago_silva.pdf',
    'sad_2025_2026_q1_tiago_silva.pdf',
  ];

  for (const pdfName of samplePdfs) {
    const filePath = path.join(uploadsSadDir, pdfName);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, minimalPdfContent);
    }
  }

  // Restantes membros da Executive Board (COO e CMO - Ambos Admins)
  await prisma.user.upsert({
    where: { email: 'vp@yme.pt' },
    update: {
      departmentId: departmentMap['Executive Board'],
      position: 'COO',
      role: Role.ADMIN,
    },
    create: {
      email: 'vp@yme.pt',
      passwordHash,
      fullName: 'Inês Duarte',
      role: Role.ADMIN,
      departmentId: departmentMap['Executive Board'],
      position: 'COO',
      careerHistory: [
        'Trainee of Brand Strategy',
        'Junior Consultant of Brand Strategy',
        'Head of Brand Strategy',
        'COO',
      ],
      taskgroups: [],
      isActive: true,
    },
  });

  await prisma.user.upsert({
    where: { email: 'exec@yme.pt' },
    update: {
      departmentId: departmentMap['Executive Board'],
      position: 'CMO',
      role: Role.ADMIN,
    },
    create: {
      email: 'exec@yme.pt',
      passwordHash,
      fullName: 'Afonso Henriques',
      role: Role.ADMIN,
      departmentId: departmentMap['Executive Board'],
      position: 'CMO',
      careerHistory: [
        'Trainee of Quality Management',
        'Junior Consultant of Quality Management',
        'Head of Quality Management',
        'CMO',
      ],
      taskgroups: [],
      isActive: true,
    },
  });

  // Recursos Humanos: Manager e Consultor alocado a Digital Development
  await prisma.user.upsert({
    where: { email: 'hr.manager@yme.pt' },
    update: {
      departmentId: departmentMap['Human Resources'],
      position: 'Manager',
      role: Role.MEMBER,
    },
    create: {
      email: 'hr.manager@yme.pt',
      passwordHash,
      fullName: 'Marta Ribeiro',
      role: Role.MEMBER,
      departmentId: departmentMap['Human Resources'],
      position: 'Manager',
      careerHistory: [
        'Trainee of Human Resources',
        'Junior Consultant of Human Resources',
        'Senior Consultant of Human Resources',
        'Manager of Human Resources',
      ],
      taskgroups: [],
      isActive: true,
    },
  });

  await prisma.user.upsert({
    where: { email: 'hr.consultant@yme.pt' },
    update: {
      departmentId: departmentMap['Human Resources'],
      assignedDepartmentId: departmentMap['Digital Development'],
      position: 'Senior Consultant',
      role: Role.MEMBER,
    },
    create: {
      email: 'hr.consultant@yme.pt',
      passwordHash,
      fullName: 'Tiago Ferreira',
      role: Role.MEMBER,
      departmentId: departmentMap['Human Resources'],
      assignedDepartmentId: departmentMap['Digital Development'],
      position: 'Senior Consultant',
      careerHistory: [
        'Trainee of Human Resources',
        'Junior Consultant of Human Resources',
        'Senior Consultant of Human Resources',
      ],
      taskgroups: ['Partnerships'],
      isActive: true,
    },
  });

  // Legal & Finance: Head (Diretor) e Manager (Membro)
  await prisma.user.upsert({
    where: { email: 'legal.head@yme.pt' },
    update: {
      departmentId: departmentMap['Legal & Finance'],
      position: 'Head',
      role: Role.DIRECTOR,
    },
    create: {
      email: 'legal.head@yme.pt',
      passwordHash,
      fullName: 'Diogo Fonseca',
      role: Role.DIRECTOR,
      departmentId: departmentMap['Legal & Finance'],
      position: 'Head',
      careerHistory: [
        'Trainee of Legal & Finance',
        'Junior Consultant of Legal & Finance',
        'Senior Consultant of Legal & Finance',
        'Manager of Legal & Finance',
        'Head of Legal & Finance',
      ],
      taskgroups: [],
      isActive: true,
    },
  });

  await prisma.user.upsert({
    where: { email: 'legal.manager@yme.pt' },
    update: {
      departmentId: departmentMap['Legal & Finance'],
      position: 'Manager',
      role: Role.MEMBER,
    },
    create: {
      email: 'legal.manager@yme.pt',
      passwordHash,
      fullName: 'Camila Neves',
      role: Role.MEMBER,
      departmentId: departmentMap['Legal & Finance'],
      position: 'Manager',
      careerHistory: [
        'Trainee of Legal & Finance',
        'Junior Consultant of Legal & Finance',
        'Senior Consultant of Legal & Finance',
        'Manager of Legal & Finance',
      ],
      taskgroups: [],
      isActive: true,
    },
  });

  // Membro Principal de Testes (Tiago Silva - Senior Consultant em Digital Development)
  const memberUser = await prisma.user.upsert({
    where: { email: 'member@yme.pt' },
    update: {
      departmentId: departmentMap['Digital Development'],
      position: 'Senior Consultant',
      role: Role.MEMBER,
    },
    create: {
      email: 'member@yme.pt',
      passwordHash,
      fullName: 'Tiago Silva',
      role: Role.MEMBER,
      departmentId: departmentMap['Digital Development'],
      position: 'Senior Consultant',
      careerHistory: [
        'Trainee of Digital Development',
        'Junior Consultant of Digital Development',
        'Senior Consultant of Digital Development',
      ],
      taskgroups: ['CSR'],
      isActive: true,
    },
  });

  // Avaliações SAD para Tiago Silva
  const sadCount = await prisma.evaluationSAD.count({ where: { userId: memberUser.id } });
  if (sadCount === 0) {
    const sadData = [
      {
        userId: memberUser.id,
        term: '2024/2025 - Q1',
        score: 4.85,
        reportPdfUrl: '/uploads/sad/sad_2024_2025_q1_tiago_silva.pdf',
        feedbackNotes:
          'Excelente integração no departamento de Digital Development. Demonstrou autonomia na refatoração da stack interna e proatividade.',
      },
      {
        userId: memberUser.id,
        term: '2024/2025 - Q2',
        score: 5.1,
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
          'Liderou com brio o task group de infraestrutura e DevOps. Capacidade de mentoria para novos trainees altamente elogiada.',
      },
      {
        userId: memberUser.id,
        term: '2024/2025 - Q4',
        score: 5.6,
        reportPdfUrl: '/uploads/sad/sad_2024_2025_q4_tiago_silva.pdf',
        feedbackNotes:
          'Desempenho exemplar no fecho do mandato. Consistência técnica e forte alinhamento com a visão estratégica da Executive Board.',
      },
      {
        userId: memberUser.id,
        term: '2025/2026 - Q1',
        score: 5.8,
        reportPdfUrl: '/uploads/sad/sad_2025_2026_q1_tiago_silva.pdf',
        feedbackNotes:
          'Início de mandato estelar como Senior Consultant em Digital Development. Papel fundamental no lançamento da nova YME APP.',
      },
    ];

    for (const item of sadData) {
      await prisma.evaluationSAD.create({ data: item });
    }
  }

  // Transações da Carteira YME para Tiago Silva
  const txCount = await prisma.walletTransaction.count({ where: { userId: memberUser.id } });
  if (txCount === 0) {
    const walletTransactions = [
      {
        userId: memberUser.id,
        amount: 25.0,
        type: WalletType.SAD_REWARD,
        description: 'Prémio de SAD 2026 - 2º Quadrimestre',
        createdAt: new Date('2026-09-02T10:00:00Z'),
      },
      {
        userId: memberUser.id,
        amount: -25.0,
        type: WalletType.EVENT_SPEND,
        description: 'Utilização de Saldo Aprovada: Participação no XI JENC',
        createdAt: new Date('2026-10-25T14:30:00Z'),
      },
      {
        userId: memberUser.id,
        amount: 35.0,
        type: WalletType.SAD_REWARD,
        description: 'Prémio de SAD 2026 - 3º Quadrimestre',
        createdAt: new Date('2026-11-01T18:00:00Z'),
      },
    ];

    for (const tx of walletTransactions) {
      await prisma.walletTransaction.create({ data: tx });
    }
  }

  // Eventos de Calendário (com categorias oficiais atualizadas)
  const calCount = await prisma.calendarEvent.count();
  if (calCount === 0) {
    const calendarEvents = [
      {
        title: 'Assembleia Geral Ordinária - Plano Estratégico',
        category: CalendarCategory.GENERAL_ASSEMBLY,
        description:
          'Apresentação dos resultados do mandato anterior, discussão do plano de atividades anual e votação das novas moções globais.',
        startTime: new Date('2026-09-10T18:30:00Z'),
        endTime: new Date('2026-09-10T21:00:00Z'),
        location: 'Auditório Principal / Sala 1.02',
      },
      {
        title: 'Workshop: Masterclass de Negociação & Pitching Comercial',
        category: CalendarCategory.FORMATION,
        description:
          'Formação avançada e prática para consultores comerciais e gestores de projeto sobre técnicas de fecho e propostas de valor.',
        startTime: new Date('2026-09-15T15:00:00Z'),
        endTime: new Date('2026-09-15T18:00:00Z'),
        location: 'Sala de Conferências YME',
      },
      {
        title: 'Ação Solidária: Recolha e Apoio Comunitário (Taskgroup CSR)',
        category: CalendarCategory.CSR_ACTIVITY,
        description:
          'Iniciativa de voluntariado e responsabilidade social promovida pelo task group CSR em colaboração com entidades locais.',
        startTime: new Date('2026-09-20T10:00:00Z'),
        endTime: new Date('2026-09-20T13:30:00Z'),
        location: 'Sede Comunitária do Porto',
      },
      {
        title: 'YME Open Day & Mostra de Parceiros 2026',
        category: CalendarCategory.OPEN_DAY,
        description:
          'Dia de portas abertas com a presença de alumni, parceiros corporativos e estudantes universitários interessados na YME.',
        startTime: new Date('2026-09-25T14:00:00Z'),
        endTime: new Date('2026-09-25T19:00:00Z'),
        location: 'Hall de Entrada & Sala de Eventos',
      },
      {
        title: 'Reunião Geral de Alinhamento Trimestral',
        category: CalendarCategory.GENERAL_MEETING,
        description:
          'Reunião com todos os departamentos para partilha de novidades, lançamentos e metas para o trimestre.',
        startTime: new Date('2026-09-28T17:00:00Z'),
        endTime: new Date('2026-09-28T19:00:00Z'),
        location: 'Sala Multiusos YME',
      },
      {
        title: 'Submissão de Relatórios de Autoavaliação SAD Q1',
        category: CalendarCategory.OTHER,
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
  }

  console.log('✅ Povoamento da base de dados YME Portal concluído com sucesso!');
}

main()
  .catch((e) => {
    console.error('❌ Erro durante o povoamento da base de dados:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
