import bcrypt from 'bcryptjs';
import { prisma } from '../config/prisma';
import { Role, Taskgroup } from '@prisma/client';

export class UserService {
  static async getAllUsers() {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        position: true,
        taskgroups: true,
        isActive: true,
        departmentId: true,
        department: {
          select: {
            id: true,
            name: true,
          },
        },
        createdAt: true,
      },
      orderBy: [{ isActive: 'desc' }, { fullName: 'asc' }],
    });

    return users;
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
        taskgroups: true,
        isActive: true,
        departmentId: true,
        department: {
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

    return user;
  }

  static async createUser(data: {
    email: string;
    passwordPlain: string;
    fullName: string;
    departmentId: string;
    position: string;
    role?: Role;
    taskgroups?: Taskgroup[];
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

    const passwordHash = await bcrypt.hash(data.passwordPlain, 10);

    const newUser = await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        fullName: data.fullName.trim(),
        departmentId: data.departmentId,
        position: data.position,
        role: data.role || Role.MEMBER,
        taskgroups: data.taskgroups || [],
        isActive: true,
      },
      include: {
        department: {
          select: { id: true, name: true },
        },
      },
    });

    // Create a welcoming timeline event
    await prisma.timelineEvent.create({
      data: {
        userId: newUser.id,
        title: 'Entrada na YME',
        category: 'RECRUITMENT',
        description: `Admissão oficial no departamento de ${newUser.department.name} como ${newUser.position}.`,
        eventDate: new Date(),
      },
    });

    return {
      id: newUser.id,
      email: newUser.email,
      fullName: newUser.fullName,
      role: newUser.role,
      position: newUser.position,
      taskgroups: newUser.taskgroups,
      department: newUser.department,
      isActive: newUser.isActive,
      createdAt: newUser.createdAt,
    };
  }

  static async updateUser(
    userId: string,
    data: {
      fullName?: string;
      departmentId?: string;
      position?: string;
      role?: Role;
      taskgroups?: Taskgroup[];
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
        ...(data.position ? { position: data.position } : {}),
        ...(data.role ? { role: data.role } : {}),
        ...(data.taskgroups !== undefined ? { taskgroups: data.taskgroups } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
      },
      include: {
        department: {
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
      taskgroups: updated.taskgroups,
      department: updated.department,
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

    // Permanently delete member (cascading evaluations, transactions, timeline)
    await prisma.user.delete({
      where: { id: userId },
    });

    return { message: `Membro ${user.fullName} excluído com sucesso.` };
  }

  static async getDepartments() {
    return prisma.department.findMany({
      orderBy: { name: 'asc' },
    });
  }

  static async getDashboardSummary(userId: string) {
    // 1. Balance
    const transactions = await prisma.walletTransaction.findMany({
      where: { userId },
      select: { amount: true },
    });
    const currentBalance = transactions.reduce((acc, curr) => acc + Number(curr.amount), 0);

    // 2. All SAD scores & Historical Average
    const sadEvaluations = await prisma.evaluationSAD.findMany({
      where: { userId },
      select: { id: true, term: true, score: true, reportPdfUrl: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
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
