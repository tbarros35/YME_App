import bcrypt from 'bcryptjs';
import { prisma } from '../config/prisma';
import { Role } from '@prisma/client';
import { EmailService } from './email.service';

export function resolveCareerHistory(user: {
  position?: string;
  role?: Role | string;
  department?: { name: string } | null;
  careerHistory?: string[];
}): string[] {
  if (user.careerHistory && user.careerHistory.length > 0) {
    return user.careerHistory;
  }

  const dept = user.department?.name || 'YME';
  const pos = (user.position || '').trim();
  const lowerPos = pos.toLowerCase();
  const isExBo =
    dept === 'Executive Board' ||
    ['ceo', 'coo', 'cmo'].some((r) => lowerPos === r || lowerPos.includes(r)) ||
    user.role === Role.ADMIN ||
    user.role === 'ADMIN';

  // 1. Executive Board members (CEO, COO, CMO)
  if (isExBo) {
    return [
      `Trainee of Brand Strategy`,
      `Junior Consultant of Brand Strategy`,
      `Head of Brand Strategy`,
      pos.toUpperCase() || 'Executive Board',
    ];
  }

  // 2. Trainee -> 1 dot
  if (lowerPos === 'trainee') {
    return [`Trainee of ${dept}`];
  }

  // 3. Junior Consultant -> 2 dots
  if (lowerPos === 'junior consultant') {
    return [`Trainee of ${dept}`, `Junior Consultant of ${dept}`];
  }

  // 4. Senior Consultant -> 3 dots
  if (lowerPos === 'senior consultant') {
    return [
      `Trainee of ${dept}`,
      `Junior Consultant of ${dept}`,
      `Senior Consultant of ${dept}`,
    ];
  }

  // 5. Manager (2nd highest position in department) -> 4 dots
  if (lowerPos === 'manager') {
    return [
      `Trainee of ${dept}`,
      `Junior Consultant of ${dept}`,
      `Senior Consultant of ${dept}`,
      `Manager of ${dept}`,
    ];
  }

  // 6. Head (Highest position in department) -> 5 dots
  if (lowerPos === 'head' || user.role === Role.DIRECTOR || user.role === 'DIRECTOR') {
    return [
      `Trainee of ${dept}`,
      `Junior Consultant of ${dept}`,
      `Senior Consultant of ${dept}`,
      `Manager of ${dept}`,
      `Head of ${dept}`,
    ];
  }

  return [`${pos || 'Membro'} of ${dept}`];
}

export class UserService {
  static async getAllUsers() {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        position: true,
        careerHistory: true,
        taskgroups: true,
        isActive: true,
        departmentId: true,
        department: {
          select: {
            id: true,
            name: true,
          },
        },
        assignedDepartmentId: true,
        assignedDepartment: {
          select: {
            id: true,
            name: true,
          },
        },
        createdAt: true,
      },
      orderBy: [{ isActive: 'desc' }, { fullName: 'asc' }],
    });

    return users.map((u) => ({
      ...u,
      careerHistory: resolveCareerHistory(u),
    }));
  }

  static async getUserById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        position: true,
        careerHistory: true,
        taskgroups: true,
        isActive: true,
        departmentId: true,
        department: {
          select: {
            id: true,
            name: true,
          },
        },
        assignedDepartmentId: true,
        assignedDepartment: {
          select: {
            id: true,
            name: true,
          },
        },
        createdAt: true,
      },
    });

    if (!user) {
      const error: any = new Error('Membro não encontrado');
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }

    return {
      ...user,
      careerHistory: resolveCareerHistory(user),
    };
  }

  static async createUser(data: {
    email: string;
    passwordPlain: string;
    fullName: string;
    departmentId: string;
    assignedDepartmentId?: string | null;
    position: string;
    role?: Role;
    taskgroups?: string[];
    careerHistory?: string[];
    highestPreviousPosition?: 'NONE' | 'TRAINEE' | 'JUNIOR_CONSULTANT';
    previousPositions?: string[];
  }) {
    const normalizedEmail = data.email.trim().toLowerCase();

    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      const error: any = new Error('Já existe um membro registado com este email institucional.');
      error.statusCode = 409;
      error.code = 'USER_EXISTS';
      throw error;
    }

    const dept = await prisma.department.findUnique({
      where: { id: data.departmentId },
    });

    if (!dept) {
      const error: any = new Error('Departamento selecionado não existe.');
      error.statusCode = 404;
      error.code = 'DEPARTMENT_NOT_FOUND';
      throw error;
    }

    const isExBoDept = dept.name === 'Executive Board';
    let assignedRole: Role = data.role || Role.MEMBER;

    // Executive Board members are ALWAYS Admins
    if (isExBoDept) {
      assignedRole = Role.ADMIN;
    } else {
      // Department Heads are DIRECTORS (never ADMIN)
      if (data.position === 'Head') {
        assignedRole = Role.DIRECTOR;
      } else {
        assignedRole = Role.MEMBER;
      }
    }

    // Determine career history
    let computedCareerHistory: string[] = [];
    if (data.careerHistory && data.careerHistory.length > 0) {
      computedCareerHistory = data.careerHistory;
    } else if (isExBoDept) {
      if (data.previousPositions && data.previousPositions.length > 0) {
        computedCareerHistory = [...data.previousPositions, data.position];
      } else {
        computedCareerHistory = [
          `Trainee of Brand Strategy`,
          `Junior Consultant of Brand Strategy`,
          `Head of Brand Strategy`,
          data.position,
        ];
      }
    } else if (data.position === 'Head' || assignedRole === Role.DIRECTOR) {
      const headTitle = `Head of ${dept.name}`;
      if (data.highestPreviousPosition === 'NONE') {
        computedCareerHistory = [headTitle];
      } else if (data.highestPreviousPosition === 'TRAINEE') {
        computedCareerHistory = [`Trainee of ${dept.name}`, headTitle];
      } else {
        // Default progression up to Head
        computedCareerHistory = [
          `Trainee of ${dept.name}`,
          `Junior Consultant of ${dept.name}`,
          `Senior Consultant of ${dept.name}`,
          `Manager of ${dept.name}`,
          headTitle,
        ];
      }
    } else {
      // Standard department progression
      const posLower = data.position.toLowerCase();
      if (posLower === 'manager') {
        computedCareerHistory = [
          `Trainee of ${dept.name}`,
          `Junior Consultant of ${dept.name}`,
          `Senior Consultant of ${dept.name}`,
          `Manager of ${dept.name}`,
        ];
      } else if (posLower.includes('senior consultant')) {
        computedCareerHistory = [
          `Trainee of ${dept.name}`,
          `Junior Consultant of ${dept.name}`,
          `Senior Consultant of ${dept.name}`,
        ];
      } else if (posLower.includes('junior consultant')) {
        computedCareerHistory = [
          `Trainee of ${dept.name}`,
          `Junior Consultant of ${dept.name}`,
        ];
      } else if (posLower.includes('trainee')) {
        computedCareerHistory = [`Trainee of ${dept.name}`];
      } else {
        computedCareerHistory = [`${data.position} of ${dept.name}`];
      }
    }

    const passwordHash = await bcrypt.hash(data.passwordPlain, 10);

    const newUser = await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        fullName: data.fullName.trim(),
        departmentId: data.departmentId,
        assignedDepartmentId: data.assignedDepartmentId || null,
        position: data.position,
        role: assignedRole,
        taskgroups: data.taskgroups || [],
        careerHistory: computedCareerHistory,
        isActive: true,
      },
      include: {
        department: {
          select: { id: true, name: true },
        },
        assignedDepartment: {
          select: { id: true, name: true },
        },
      },
    });

    // Create a welcoming timeline event under the initial role
    await prisma.timelineEvent.create({
      data: {
        userId: newUser.id,
        title: 'Entrada na YME',
        category: 'RECRUITMENT',
        roleStep: computedCareerHistory[0] || `${newUser.position} of ${newUser.department.name}`,
        description: `Admissão oficial no departamento de ${newUser.department.name} como ${newUser.position}.`,
        eventDate: new Date(),
      },
    });

    // Envio assíncrono do email de boas-vindas com dados de acesso
    EmailService.sendWelcomeEmail({
      to: newUser.email,
      fullName: newUser.fullName,
      tempPassword: data.passwordPlain,
      departmentName: newUser.department.name,
      position: newUser.position,
    }).catch((err) => {
      console.error('[UserService] Falha ao despachar email de boas-vindas:', err);
    });

    return {
      id: newUser.id,
      email: newUser.email,
      fullName: newUser.fullName,
      role: newUser.role,
      position: newUser.position,
      careerHistory: computedCareerHistory,
      taskgroups: newUser.taskgroups,
      department: newUser.department,
      assignedDepartment: newUser.assignedDepartment,
      assignedDepartmentId: newUser.assignedDepartmentId,
      isActive: newUser.isActive,
      createdAt: newUser.createdAt,
    };
  }

  static async updateUser(
    userId: string,
    data: {
      fullName?: string;
      departmentId?: string;
      assignedDepartmentId?: string | null;
      position?: string;
      role?: Role;
      taskgroups?: string[];
      careerHistory?: string[];
      isActive?: boolean;
    }
  ) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      const error: any = new Error('Membro não encontrado.');
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }

    if (data.departmentId) {
      const dept = await prisma.department.findUnique({ where: { id: data.departmentId } });
      if (!dept) {
        const error: any = new Error('Departamento inválido.');
        error.statusCode = 404;
        error.code = 'DEPARTMENT_NOT_FOUND';
        throw error;
      }
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.fullName ? { fullName: data.fullName.trim() } : {}),
        ...(data.departmentId ? { departmentId: data.departmentId } : {}),
        ...(data.assignedDepartmentId !== undefined
          ? { assignedDepartmentId: data.assignedDepartmentId }
          : {}),
        ...(data.position ? { position: data.position } : {}),
        ...(data.role ? { role: data.role } : {}),
        ...(data.taskgroups !== undefined ? { taskgroups: data.taskgroups } : {}),
        ...(data.careerHistory !== undefined ? { careerHistory: data.careerHistory } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
      },
      include: {
        department: {
          select: { id: true, name: true },
        },
        assignedDepartment: {
          select: { id: true, name: true },
        },
      },
    });

    return {
      id: updated.id,
      email: updated.email,
      fullName: updated.fullName,
      role: updated.role,
      position: updated.position,
      careerHistory: resolveCareerHistory(updated),
      taskgroups: updated.taskgroups,
      department: updated.department,
      assignedDepartment: updated.assignedDepartment,
      assignedDepartmentId: updated.assignedDepartmentId,
      isActive: updated.isActive,
      createdAt: updated.createdAt,
    };
  }

  static async updateUserPassword(userId: string, newPasswordPlain: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      const error: any = new Error('Membro não encontrado.');
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }

    const passwordHash = await bcrypt.hash(newPasswordPlain, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    // Envio assíncrono do email de notificação com a nova palavra-passe
    EmailService.sendPasswordResetEmail({
      to: user.email,
      fullName: user.fullName,
      newPassword: newPasswordPlain,
    }).catch((err) => {
      console.error('[UserService] Falha ao despachar email de reset de password:', err);
    });

    return { message: `Palavra-passe do membro ${user.fullName} atualizada com sucesso.` };
  }

  static async deleteUser(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      const error: any = new Error('Membro não encontrado.');
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }

    await prisma.user.delete({ where: { id: userId } });
    return { message: `Membro ${user.fullName} excluído com sucesso.` };
  }

  static async getDepartments() {
    return prisma.department.findMany({
      orderBy: { name: 'asc' },
    });
  }

  static async getDashboardSummary(userId: string) {
    // 1. Current Balance
    const transactions = await prisma.walletTransaction.findMany({
      where: { userId },
      select: { amount: true },
    });
    const currentBalance = transactions.reduce((acc, curr) => acc + Number(curr.amount), 0);

    // 2. SAD Evaluations average and latest
    const sadEvaluations = await prisma.evaluationSAD.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        term: true,
        score: true,
        reportPdfUrl: true,
      },
    });

    const totalSadCount = sadEvaluations.length;
    const sadAverage =
      totalSadCount > 0
        ? Number(
            (
              sadEvaluations.reduce((acc, curr) => acc + Number(curr.score), 0) /
              totalSadCount
            ).toFixed(2)
          )
        : null;

    const latestSad =
      totalSadCount > 0
        ? {
            id: sadEvaluations[0].id,
            term: sadEvaluations[0].term,
            score: Number(sadEvaluations[0].score),
            reportPdfUrl: sadEvaluations[0].reportPdfUrl,
          }
        : null;

    // 3. Next Upcoming Event (now onwards)
    const now = new Date();
    const nextEvent = await prisma.calendarEvent.findFirst({
      where: {
        endTime: { gte: now },
      },
      orderBy: { startTime: 'asc' },
    });

    // 4. Milestone count
    const totalMilestones = await prisma.timelineEvent.count({
      where: { userId },
    });

    return {
      balance: Number(currentBalance.toFixed(2)),
      sadAverage,
      totalSadCount,
      latestSad,
      nextEvent: nextEvent
        ? {
            id: nextEvent.id,
            title: nextEvent.title,
            category: nextEvent.category,
            startTime: nextEvent.startTime,
            endTime: nextEvent.endTime,
            location: nextEvent.location,
          }
        : null,
      totalMilestones,
    };
  }
}
