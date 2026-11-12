import { PrismaClient, Role, TimelineCategory } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const testEmail = 'gustavo.teste@yme.pt';
  const tempPassword = 'GustavoTeste2026!';
  const fullName = 'Gustavo Dias';

  console.log(`🚀 A iniciar criação da conta de teste para ${fullName}...`);
  console.log(`📧 Email de Teste (seguro): ${testEmail}`);

  // 1. Fetch Brand Strategy department
  const brandDept = await prisma.department.findFirst({
    where: { name: 'Brand Strategy' },
  });

  if (!brandDept) {
    throw new Error('Departamento "Brand Strategy" não encontrado.');
  }

  // 2. Remove previous test account if it already exists
  const existing = await prisma.user.findUnique({ where: { email: testEmail } });
  if (existing) {
    console.log(`A remover conta de teste anterior (${testEmail})...`);
    await prisma.user.delete({ where: { id: existing.id } });
  }

  // 3. Hash provisional password
  const passwordHash = await bcrypt.hash(tempPassword, 10);

  // 4. Create user
  const user = await prisma.user.create({
    data: {
      fullName,
      email: testEmail,
      passwordHash,
      departmentId: brandDept.id,
      position: 'Head of Brand Strategy',
      role: Role.DIRECTOR,
      taskgroups: [], // past taskgroups ended on 13/07/2026
      careerHistory: [
        'Trainee of Brand Strategy',
        'Junior Consultant of Brand Strategy',
        'Head of Brand Strategy',
      ],
      mustChangePassword: true,
      isActive: true,
    },
  });

  console.log(`✅ Utilizador criado com ID: ${user.id}`);

  // 5. Timeline - Recruitment
  await prisma.timelineEvent.create({
    data: {
      userId: user.id,
      title: 'Entrada na YME',
      category: TimelineCategory.RECRUITMENT,
      roleStep: 'Trainee of Brand Strategy',
      description: 'Admissão oficial na YME no departamento de Brand Strategy como Trainee.',
      eventDate: new Date('2025-07-16T12:00:00.000Z'),
    },
  });

  // 6. Timeline - Career Progressions
  await prisma.timelineEvent.create({
    data: {
      userId: user.id,
      title: 'Junior Consultant of Brand Strategy',
      category: TimelineCategory.FORMATION,
      roleStep: 'Junior Consultant of Brand Strategy',
      description: 'Promoção a Junior Consultant (Brand Strategy) no departamento de Brand Strategy.',
      eventDate: new Date('2025-10-24T12:00:00.000Z'),
    },
  });

  await prisma.timelineEvent.create({
    data: {
      userId: user.id,
      title: 'Head of Brand Strategy',
      category: TimelineCategory.FORMATION,
      roleStep: 'Head of Brand Strategy',
      description: 'Promoção a Head of Brand Strategy no departamento de Brand Strategy.',
      eventDate: new Date('2026-07-13T12:00:00.000Z'),
    },
  });

  // 7. Timeline - Taskgroup Milestones
  const taskgroupMilestones = [
    {
      title: 'HIVE (Membro)',
      roleStep: 'Trainee of Brand Strategy',
      description: 'Participação na taskgroup HIVE como Membro (16/07/2025 - 16/11/2025 | 123 Dias).',
      eventDate: new Date('2025-07-16T12:00:00.000Z'),
    },
    {
      title: 'HIVE (Membro)',
      roleStep: 'Junior Consultant of Brand Strategy',
      description: 'Participação na taskgroup HIVE como Membro (17/11/2025 - 16/03/2026 | 119 Dias).',
      eventDate: new Date('2025-11-17T12:00:00.000Z'),
    },
    {
      title: 'HIVE (PM)',
      roleStep: 'Junior Consultant of Brand Strategy',
      description: 'Participação na taskgroup HIVE como PM (Project Manager) (17/03/2026 - 13/07/2026 | 118 Dias).',
      eventDate: new Date('2026-03-17T12:00:00.000Z'),
    },
  ];

  for (const tgm of taskgroupMilestones) {
    await prisma.timelineEvent.create({
      data: {
        userId: user.id,
        title: tgm.title,
        category: TimelineCategory.TASKGROUP,
        roleStep: tgm.roleStep,
        description: tgm.description,
        eventDate: tgm.eventDate,
      },
    });
  }

  // 8. Timeline - Junior Movement Event Milestones
  const eventMilestones = [
    {
      title: 'IX JENC (2025)',
      roleStep: 'Trainee of Brand Strategy',
      description: 'Participação no IX JENC (2025) durante a fase de Trainee.',
      eventDate: new Date('2025-10-15T12:00:00.000Z'),
    },
    {
      title: 'X JENC (2026)',
      roleStep: 'Junior Consultant of Brand Strategy',
      description: 'Participação no X JENC (2026) como Junior Consultant.',
      eventDate: new Date('2026-01-20T12:00:00.000Z'),
    },
    {
      title: 'XI JENC (2026)',
      roleStep: 'Junior Consultant of Brand Strategy',
      description: 'Participação no XI JENC (2026) como Junior Consultant.',
      eventDate: new Date('2026-05-15T12:00:00.000Z'),
    },
    {
      title: 'ExBo Meeting (2026)',
      roleStep: 'Head of Brand Strategy',
      description: 'Participação no ExBo Meeting (2026) como Head of Brand Strategy.',
      eventDate: new Date('2026-07-20T12:00:00.000Z'),
    },
    {
      title: 'XII JENC (2026)',
      roleStep: 'Head of Brand Strategy',
      description: 'Participação no XII JENC (2026) como Head of Brand Strategy.',
      eventDate: new Date('2026-10-20T12:00:00.000Z'),
    },
  ];

  for (const evm of eventMilestones) {
    await prisma.timelineEvent.create({
      data: {
        userId: user.id,
        title: evm.title,
        category: TimelineCategory.FORMATION,
        roleStep: evm.roleStep,
        description: evm.description,
        eventDate: evm.eventDate,
      },
    });
  }

  console.log(`🎉 Conta de teste de Gustavo Dias configurada com 100% de sucesso!`);
  console.log(`-----------------------------------------------`);
  console.log(`Login:    ${testEmail}`);
  console.log(`Password: ${tempPassword}`);
  console.log(`-----------------------------------------------`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
