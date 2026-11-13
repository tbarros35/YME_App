import { PrismaClient, Role, TimelineCategory } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
const emailServicePath = fs.existsSync(path.resolve(__dirname, '../src/services/email.service.ts'))
  ? path.resolve(__dirname, '../src/services/email.service.ts')
  : path.resolve(__dirname, '../dist/services/email.service.js');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { EmailService } = require(emailServicePath);

const prisma = new PrismaClient();

interface MemberRecord {
  name: string;
  email: string;
  department: string;
  position: string;
  role: string;
  careerHistory: string[];
  admissionDate: string;
  activeTaskgroups: string[];
  careerMilestones: Array<{
    title: string;
    category: string;
    description: string;
    roleStep: string;
    eventDate: string;
  }>;
  taskgroupMilestones: Array<{
    title: string;
    category: string;
    description: string;
    roleStep?: string;
    eventDate: string;
    isCurrent: boolean;
  }>;
  eventMilestones: Array<{
    title: string;
    category: string;
    description: string;
    roleStep?: string;
    eventDate: string;
  }>;
  projectMilestones?: Array<{
    title: string;
    category: string;
    description: string;
    roleStep?: string;
    eventDate: string;
  }>;
}

export async function importMembers(dryRun = false, filter?: string) {
  const jsonPath = path.resolve(__dirname, '../scripts/processed_members.json');
  if (!fs.existsSync(jsonPath)) {
    throw new Error(`Ficheiro de dados não encontrado: ${jsonPath}`);
  }

  let members: MemberRecord[] = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  if (filter) {
    const f = filter.toLowerCase().trim();
    if (f === 'directors' || f === 'diretores' || f === 'director') {
      members = members.filter((m) => m.role === 'DIRECTOR' || m.position.toLowerCase().startsWith('head'));
      console.log(`🔍 Filtro aplicado: Diretores -> ${members.length} membro(s) selecionado(s)`);
    } else {
      members = members.filter((m) => m.email.toLowerCase() === f || m.name.toLowerCase().includes(f));
      console.log(`🔍 Filtro aplicado: "${filter}" -> ${members.length} membro(s) selecionado(s)`);
    }
  } else {
    console.log(`📋 Total de membros a importar: ${members.length}`);
  }

  // Fetch departments map
  const depts = await prisma.department.findMany();
  const deptMap: Record<string, string> = {};
  depts.forEach((d) => {
    deptMap[d.name.toLowerCase().trim()] = d.id;
  });

  const summary = {
    created: 0,
    skipped: 0,
    emailsSent: 0,
    errors: [] as string[],
  };

  for (const m of members) {
    const deptId = deptMap[m.department.toLowerCase().trim()];
    if (!deptId) {
      console.warn(`⚠️ Departamento não encontrado para ${m.name}: "${m.department}"`);
      summary.errors.push(`Dept não encontrado: ${m.name} (${m.department})`);
      continue;
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: m.email },
    });

    if (existingUser) {
      console.log(`⏩ Membro já existente: ${m.name} (${m.email}) - a ignorar criação`);
      summary.skipped++;
      continue;
    }

    // Generate readable random temp password: Yme2026! + 4 random digits
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const tempPassword = `Yme2026!${randomDigits}`;
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    const userRole = m.role === 'DIRECTOR' ? Role.DIRECTOR : Role.MEMBER;

    if (dryRun) {
      console.log(`[DRY-RUN] Criaria membro: ${m.name} (${m.email}) - ${m.position} [${m.department}]`);
      summary.created++;
      continue;
    }

    try {
      const user = await prisma.user.create({
        data: {
          fullName: m.name,
          email: m.email,
          passwordHash,
          departmentId: deptId,
          position: m.position,
          role: userRole,
          taskgroups: m.activeTaskgroups,
          careerHistory: m.careerHistory,
          mustChangePassword: true,
          isActive: true,
        },
      });

      // 1. Initial Recruitment Milestone
      await prisma.timelineEvent.create({
        data: {
          userId: user.id,
          title: 'Entrada na YME',
          category: TimelineCategory.RECRUITMENT,
          roleStep: m.careerHistory[0] || `${m.position} of ${m.department}`,
          description: `Admissão oficial na YME no departamento de ${m.department}.`,
          eventDate: new Date(m.admissionDate),
        },
      });

      // 2. Taskgroup Milestones
      for (const tgm of m.taskgroupMilestones) {
        await prisma.timelineEvent.create({
          data: {
            userId: user.id,
            title: tgm.title,
            category: TimelineCategory.TASKGROUP,
            roleStep: tgm.roleStep || m.careerHistory[0],
            description: tgm.description,
            eventDate: new Date(tgm.eventDate),
          },
        });
      }

      // 4. Junior Movement Event Milestones
      for (const evm of m.eventMilestones) {
        await prisma.timelineEvent.create({
          data: {
            userId: user.id,
            title: evm.title,
            category: TimelineCategory.FORMATION,
            roleStep: evm.roleStep || m.careerHistory[0],
            description: evm.description,
            eventDate: new Date(evm.eventDate),
          },
        });
      }

      // 5. External Projects Milestones (Serviços)
      if (m.projectMilestones && m.projectMilestones.length > 0) {
        for (const prj of m.projectMilestones) {
          await prisma.timelineEvent.create({
            data: {
              userId: user.id,
              title: prj.title,
              category: TimelineCategory.PROJECT,
              roleStep: prj.roleStep || m.careerHistory[0],
              description: prj.description,
              eventDate: new Date(prj.eventDate),
            },
          });
        }
      }

      // 6. Send Welcome Email with temporary password
      try {
        const sent = await EmailService.sendWelcomeEmail({
          to: user.email,
          fullName: user.fullName,
          tempPassword,
          departmentName: m.department,
          position: m.position,
        });
        if (sent) {
          summary.emailsSent++;
          console.log(`✉️ Email de boas-vindas enviado para ${user.email}`);
        } else {
          console.warn(`⚠️ Falha no envio do email para ${user.email}`);
        }
      } catch (mailErr) {
        console.error(`❌ Erro ao enviar email para ${user.email}:`, mailErr);
      }

      summary.created++;
      console.log(`✅ Membro criado com sucesso: ${user.fullName} (${user.email})`);
      console.log(`🔑 Credenciais geradas -> Email: ${user.email} | Palavra-passe provisória: ${tempPassword}`);
    } catch (err: any) {
      console.error(`❌ Erro ao criar utilizador ${m.name}:`, err);
      summary.errors.push(`${m.name}: ${err.message}`);
    }
  }

  console.log('\n📊 Resumo da Importação:');
  console.log(`- Criados: ${summary.created}`);
  console.log(`- Ignorados (já existiam): ${summary.skipped}`);
  console.log(`- Emails enviados: ${summary.emailsSent}`);
  console.log(`- Erros: ${summary.errors.length}`);

  return summary;
}

// If run directly via command line
if (require.main === module) {
  const isDryRun = process.argv.includes('--dry-run');
  const filterArgIdx = process.argv.findIndex((a) => a === '--filter' || a === '--email' || a === '--name');
  const filter = filterArgIdx !== -1 ? process.argv[filterArgIdx + 1] : undefined;

  importMembers(isDryRun, filter)
    .then((summary) => {
      console.log('Resultados:', summary);
      return prisma.$disconnect();
    })
    .catch((err) => {
      console.error(err);
      prisma.$disconnect();
      process.exit(1);
    });
}
