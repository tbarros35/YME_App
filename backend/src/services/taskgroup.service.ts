import { prisma } from '../config/prisma';

export class TaskgroupService {
  static async getAll() {
    return prisma.taskgroup.findMany({
      orderBy: { createdAt: 'asc' },
    });
  }

  static async create(name: string) {
    const trimmed = name.trim();
    if (!trimmed) {
      const error: any = new Error('O nome da taskgroup é obrigatório.');
      error.statusCode = 400;
      error.code = 'INVALID_INPUT';
      throw error;
    }

    const existing = await prisma.taskgroup.findFirst({
      where: {
        name: { equals: trimmed, mode: 'insensitive' },
      },
    });

    if (existing) {
      const error: any = new Error(`A taskgroup "${trimmed}" já existe.`);
      error.statusCode = 409;
      error.code = 'DUPLICATE_TASKGROUP';
      throw error;
    }

    return prisma.taskgroup.create({
      data: { name: trimmed },
    });
  }

  static async delete(id: string) {
    const tg = await prisma.taskgroup.findUnique({
      where: { id },
    });

    if (!tg) {
      const error: any = new Error('Taskgroup não encontrada.');
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }

    // Remove this taskgroup from any users who currently have it
    const users = await prisma.user.findMany({
      where: {
        taskgroups: { has: tg.name },
      },
    });

    for (const u of users) {
      await prisma.user.update({
        where: { id: u.id },
        data: {
          taskgroups: u.taskgroups.filter(
            (t) => t.toLowerCase() !== tg.name.toLowerCase()
          ),
        },
      });
    }

    await prisma.taskgroup.delete({
      where: { id },
    });

    return { message: `Taskgroup "${tg.name}" removida com sucesso.` };
  }
}
