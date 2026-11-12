import {
  PrismaClient,
  Role,
  TimelineCategory,
  WalletType,
  WalletRequestStatus,
  ReimbursementStatus,
  SupportCategory,
  SupportStatus,
  CalendarCategory,
} from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 A preparar criação da conta de demonstração (Junior Consultant)...');

  // 1. Garantir que o departamento "Brand Strategy" existe
  let dept = await prisma.department.findFirst({
    where: { name: { equals: 'Brand Strategy', mode: 'insensitive' } },
  });

  if (!dept) {
    dept = await prisma.department.findFirst();
  }

  if (!dept) {
    throw new Error('Nenhum departamento encontrado na base de dados.');
  }

  // 2. Apagar conta demo anterior se existir (para garantir idempotência limpa)
  const demoEmail = 'demo.consultor@yme.pt';
  const existing = await prisma.user.findUnique({ where: { email: demoEmail } });
  if (existing) {
    console.log('🔄 Conta demo já existia. A remover para recriar dados atualizados...');
    await prisma.user.delete({ where: { id: existing.id } });
  }

  // 3. Criar utilizador
  const plainPassword = 'Demo2026!';
  const passwordHash = await bcrypt.hash(plainPassword, 10);

  const user = await prisma.user.create({
    data: {
      fullName: 'Tomás Silva (Conta Demo)',
      email: demoEmail,
      passwordHash,
      role: Role.MEMBER,
      departmentId: dept.id,
      position: 'Junior Consultant of Brand Strategy',
      taskgroups: ['Partnerships', 'HIVE'],
      careerHistory: [
        'Trainee of Brand Strategy',
        'Junior Consultant of Brand Strategy',
      ],
      mustChangePassword: false, // Login imediato sem pedir troca para demonstrações
      isActive: true,
    },
  });

  console.log(`✅ Utilizador criado: ${user.fullName} (${user.email})`);

  // 4. Percurso / Linha do Tempo (Timeline)
  const timelineMilestones = [
    {
      title: 'Entrada na YME',
      category: TimelineCategory.RECRUITMENT,
      roleStep: 'Trainee of Brand Strategy',
      description: 'Admissão oficial na YME no departamento de Brand Strategy.',
      eventDate: new Date('2025-07-16T10:00:00Z'),
    },
    {
      title: 'IX JENC (2025)',
      category: TimelineCategory.FORMATION,
      roleStep: 'Trainee of Brand Strategy',
      description: 'Participação no encontro nacional do Movimento Júnior: IX JENC.',
      eventDate: new Date('2025-10-15T10:00:00Z'),
    },
    {
      title: 'HIVE (Membro)',
      category: TimelineCategory.TASKGROUP,
      roleStep: 'Junior Consultant of Brand Strategy',
      description: 'Participação ativa na taskgroup HIVE como membro (17/11/2025 - 16/03/2026).',
      eventDate: new Date('2025-11-17T10:00:00Z'),
    },
    {
      title: 'X JENC (2026)',
      category: TimelineCategory.FORMATION,
      roleStep: 'Junior Consultant of Brand Strategy',
      description: 'Participação no encontro nacional do Movimento Júnior: X JENC.',
      eventDate: new Date('2026-01-20T10:00:00Z'),
    },
    {
      title: 'CLM - Brand Rebranding & Design',
      category: TimelineCategory.PROJECT,
      roleStep: 'Junior Consultant of Brand Strategy',
      description: 'Consultor executivo no projeto externo de rebranding para o cliente CLM.',
      eventDate: new Date('2026-02-15T10:00:00Z'),
    },
    {
      title: 'XI JENC (2026)',
      category: TimelineCategory.FORMATION,
      roleStep: 'Junior Consultant of Brand Strategy',
      description: 'Participação no encontro nacional do Movimento Júnior: XI JENC.',
      eventDate: new Date('2026-05-15T10:00:00Z'),
    },
    {
      title: 'jeniAL (2026)',
      category: TimelineCategory.FORMATION,
      roleStep: 'Junior Consultant of Brand Strategy',
      description: 'Participação no congresso nacional do Movimento Júnior: jeniAL.',
      eventDate: new Date('2026-05-16T10:00:00Z'),
    },
    {
      title: 'Partnerships (Membro)',
      category: TimelineCategory.TASKGROUP,
      roleStep: 'Junior Consultant of Brand Strategy',
      description: 'Membro ativo na taskgroup Partnerships.',
      eventDate: new Date('2026-03-17T10:00:00Z'),
    },
  ];

  for (const m of timelineMilestones) {
    await prisma.timelineEvent.create({
      data: {
        userId: user.id,
        title: m.title,
        category: m.category,
        roleStep: m.roleStep,
        description: m.description,
        eventDate: m.eventDate,
      },
    });
  }
  console.log(`✅ ${timelineMilestones.length} marcos adicionados ao percurso.`);

  // 5. Avaliações de SAD (Com notas e evolução para gráfico)
  const sadEvaluations = [
    {
      term: '2025/2026 - Q1',
      score: 4.85,
      reportPdfUrl: 'https://app.yme.pt/uploads/sad/demo_sad_report_q1.pdf',
      feedbackNotes:
        'Excelente dedicação e forte espírito de equipa. Cumpriu com elevado rigor todos os prazos das atividades do departamento de Brand Strategy.',
      createdAt: new Date('2025-11-10T12:00:00Z'),
    },
    {
      term: '2025/2026 - Q2',
      score: 5.20,
      reportPdfUrl: 'https://app.yme.pt/uploads/sad/demo_sad_report_q2.pdf',
      feedbackNotes:
        'Notável evolução na autonomia e no pensamento estratégico. Participação exemplar nas reuniões de equipa e na dinamização da taskgroup.',
      createdAt: new Date('2026-02-20T12:00:00Z'),
    },
    {
      term: '2025/2026 - Q3',
      score: 5.65,
      reportPdfUrl: 'https://app.yme.pt/uploads/sad/demo_sad_report_q3.pdf',
      feedbackNotes:
        'Desempenho de topo no projeto externo CLM. Grande proatividade na resolução de bloqueios e excelente representação institucional da YME.',
      createdAt: new Date('2026-05-25T12:00:00Z'),
    },
  ];

  for (const sad of sadEvaluations) {
    await prisma.evaluationSAD.create({
      data: {
        userId: user.id,
        term: sad.term,
        score: sad.score,
        reportPdfUrl: sad.reportPdfUrl,
        feedbackNotes: sad.feedbackNotes,
        createdAt: sad.createdAt,
      },
    });
  }
  console.log(`✅ ${sadEvaluations.length} avaliações SAD adicionadas (Média: 5.23/6.00).`);

  // 6. Carteira YME: Movimentos & Transações
  const walletMovements = [
    {
      amount: 50.0,
      type: WalletType.SAD_REWARD,
      description: 'Recompensa SAD 2025/2026 - Q1 (Nota: 4.85)',
      createdAt: new Date('2025-11-11T14:30:00Z'),
    },
    {
      amount: 15.0,
      type: WalletType.PRESENCE_BONUS,
      description: 'Bónus de Presença Integral em Assembleias Gerais (1º Semestre)',
      createdAt: new Date('2025-12-18T10:00:00Z'),
    },
    {
      amount: -35.0,
      type: WalletType.EVENT_SPEND,
      description: 'Comparticipação Inscrição X JENC 2026',
      createdAt: new Date('2026-01-12T16:00:00Z'),
    },
    {
      amount: 60.0,
      type: WalletType.SAD_REWARD,
      description: 'Recompensa SAD 2025/2026 - Q2 (Nota: 5.20)',
      createdAt: new Date('2026-02-21T11:00:00Z'),
    },
    {
      amount: -35.0,
      type: WalletType.EVENT_SPEND,
      description: 'Merchandising Oficial YME (Hoodie Institucional)',
      createdAt: new Date('2026-04-15T15:20:00Z'),
    },
    {
      amount: 30.0,
      type: WalletType.ADJUSTMENT,
      description: 'Prémio de Reconhecimento pela entrega com distinção no Projeto CLM',
      createdAt: new Date('2026-05-28T09:45:00Z'),
    },
  ];

  for (const tx of walletMovements) {
    await prisma.walletTransaction.create({
      data: {
        userId: user.id,
        amount: tx.amount,
        type: tx.type,
        description: tx.description,
        createdAt: tx.createdAt,
      },
    });
  }
  console.log(`✅ ${walletMovements.length} movimentos de carteira criados (Saldo Disponível: 85.00€).`);

  // 7. Pedidos de Carteira & Reembolsos
  await prisma.walletRequest.create({
    data: {
      userId: user.id,
      amount: 35.0,
      justification: 'Aquisição de Hoodie Institucional YME através do saldo da carteira',
      status: WalletRequestStatus.APPROVED,
      createdAt: new Date('2026-04-14T10:00:00Z'),
      reviewedAt: new Date('2026-04-15T14:00:00Z'),
    },
  });

  await prisma.reimbursementRequest.create({
    data: {
      userId: user.id,
      amount: 22.4,
      justification:
        'Deslocação de comboio (Braga - Porto Campanhã) para reunião presencial com cliente do Projeto CLM',
      receiptUrl: 'https://app.yme.pt/uploads/receipts/demo_bilhete_comboio.pdf',
      status: ReimbursementStatus.APPROVED,
      refundProofUrl: 'https://app.yme.pt/uploads/receipts/demo_comprovativo_reembolso.pdf',
      createdAt: new Date('2026-05-20T11:00:00Z'),
      reviewedAt: new Date('2026-05-22T16:00:00Z'),
    },
  });
  console.log('✅ Pedidos de carteira e reembolso aprovados registados.');

  // 8. Ticket de Suporte Resolvido
  const adminOrHr = await prisma.user.findFirst({
    where: {
      OR: [
        { role: Role.DIRECTOR },
        { role: Role.ADMIN },
      ],
      id: { not: user.id },
    },
  });

  const ticket = await prisma.supportTicket.create({
    data: {
      userId: user.id,
      category: SupportCategory.SAD_EVALUATION,
      subject: 'Dúvida sobre os critérios do SAD Q2',
      status: SupportStatus.RESOLVED,
      createdAt: new Date('2026-02-22T10:00:00Z'),
    },
  });

  await prisma.supportMessage.create({
    data: {
      ticketId: ticket.id,
      senderId: user.id,
      content:
        'Olá equipa de RH! Tinha uma dúvida sobre os critérios do parâmetro de proatividade na avaliação do Q2. Obrigado!',
      createdAt: new Date('2026-02-22T10:00:00Z'),
    },
  });

  if (adminOrHr) {
    await prisma.supportMessage.create({
      data: {
        ticketId: ticket.id,
        senderId: adminOrHr.id,
        content:
          'Olá Tomás! O parâmetro de proatividade avalia as iniciativas autónomas e a resolução de impedimentos antes de escalarem. A tua pontuação refletiu o excelente empenho no projeto CLM. Qualquer questão adicional estamos sempre disponíveis!',
        createdAt: new Date('2026-02-22T14:30:00Z'),
      },
    });
  }
  console.log('✅ Ticket de suporte resolvido com mensagens registado.');

  // 9. Garantir eventos no Calendário para demonstrar visualmente
  const calCount = await prisma.calendarEvent.count();
  if (calCount < 3) {
    const demoCalendarEvents = [
      {
        title: 'Assembleia Geral Ordinária',
        description: 'Discussão e votação do plano de atividades e contas semestrais da YME.',
        category: CalendarCategory.GENERAL_ASSEMBLY,
        startTime: new Date('2026-11-21T18:00:00Z'),
        endTime: new Date('2026-11-21T20:30:00Z'),
        location: 'Auditório Nobre - Campus de Gualtar',
      },
      {
        title: 'Reunião Geral de Membros (RGM)',
        description: 'Alinhamento geral de projetos, anúncios da direção e novidades das taskgroups.',
        category: CalendarCategory.GENERAL_MEETING,
        startTime: new Date('2026-11-28T18:30:00Z'),
        endTime: new Date('2026-11-28T20:00:00Z'),
        location: 'Sede da YME / Google Meet',
      },
      {
        title: 'Teambuilding de Natal & Jantar YME',
        description: 'Momento de convívio e encerramento das atividades de 2026.',
        category: CalendarCategory.TEAMBUILDING,
        startTime: new Date('2026-12-19T20:00:00Z'),
        endTime: new Date('2026-12-19T23:59:00Z'),
        location: 'Braga Centro',
      },
    ];

    for (const evt of demoCalendarEvents) {
      await prisma.calendarEvent.create({ data: evt });
    }
    console.log(`✅ ${demoCalendarEvents.length} eventos futuros de calendário adicionados.`);
  }

  console.log('\n🎉 CONTA DE DEMONSTRAÇÃO CRIADA COM SUCESSO!');
  console.log(`👉 Email de Login: ${demoEmail}`);
  console.log(`👉 Palavra-passe: ${plainPassword}`);
  console.log('👉 MustChangePassword: false (Acesso direto sem interrupções)');
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error('❌ Erro ao criar conta de demonstração:', e);
    prisma.$disconnect();
    process.exit(1);
  });
