import { prisma } from '../config/prisma';
import { Prisma } from '@prisma/client';

export class SadService {
  static async getMyEvaluations(userId: string) {
    const evaluations = await prisma.evaluationSAD.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return evaluations.map((ev) => ({
      id: ev.id,
      userId: ev.userId,
      term: ev.term,
      score: Number(ev.score),
      reportPdfUrl: ev.reportPdfUrl,
      feedbackNotes: ev.feedbackNotes,
      createdAt: ev.createdAt,
    }));
  }

  static async getUserEvaluations(
    userId: string,
    requester?: {
      id: string;
      role: string;
      departmentName?: string;
      position?: string;
      assignedDepartmentId?: string | null;
    }
  ) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, fullName: true, email: true, departmentId: true },
    });

    if (!user) {
      const error: any = new Error('Membro não encontrado');
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }

    if (requester) {
      const isAdmin = requester.role === 'ADMIN';
      const isHR = requester.departmentName === 'Human Resources';
      const isHRLeadership = isHR && (requester.position === 'Head' || requester.position === 'Manager');

      if (!isAdmin && !isHRLeadership && isHR) {
        if (!requester.assignedDepartmentId || user.departmentId !== requester.assignedDepartmentId) {
          const error: any = new Error(
            'Apenas podes consultar avaliações SAD de membros pertencentes ao departamento ao qual estás alocado.'
          );
          error.statusCode = 403;
          error.code = 'FORBIDDEN';
          throw error;
        }
      }
    }

    const evaluations = await prisma.evaluationSAD.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return {
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
      },
      evaluations: evaluations.map((ev) => ({
        id: ev.id,
        userId: ev.userId,
        term: ev.term,
        score: Number(ev.score),
        reportPdfUrl: ev.reportPdfUrl,
        feedbackNotes: ev.feedbackNotes,
        createdAt: ev.createdAt,
      })),
    };
  }

  static async createEvaluation(
    data: {
      userId: string;
      term: string;
      score: number;
      reportPdfUrl: string;
      feedbackNotes?: string;
    },
    creator?: {
      id: string;
      role: string;
      departmentName?: string;
      position?: string;
      assignedDepartmentId?: string | null;
    }
  ) {
    const user = await prisma.user.findUnique({
      where: { id: data.userId },
      include: {
        department: { select: { id: true, name: true } },
      },
    });

    if (!user) {
      const error: any = new Error('Membro não encontrado');
      error.statusCode = 404;
      error.code = 'USER_NOT_FOUND';
      throw error;
    }

    // Permission enforcement:
    // - Admin: universal
    // - HR Head & Manager: universal
    // - Other HR members: restricted to their assignedDepartmentId
    if (creator) {
      const isAdmin = creator.role === 'ADMIN';
      const isHR = creator.departmentName === 'Human Resources';
      const isHRLeadership = isHR && (creator.position === 'Head' || creator.position === 'Manager');

      if (!isAdmin && !isHRLeadership) {
        if (!isHR) {
          const error: any = new Error('Acesso reservado a Recursos Humanos e Executive Board.');
          error.statusCode = 403;
          error.code = 'FORBIDDEN';
          throw error;
        }

        if (!creator.assignedDepartmentId || user.departmentId !== creator.assignedDepartmentId) {
          const error: any = new Error(
            'Como membro de Recursos Humanos, apenas podes lançar avaliações SAD para membros pertencentes ao departamento ao qual estás alocado.'
          );
          error.statusCode = 403;
          error.code = 'FORBIDDEN';
          throw error;
        }
      }
    }

    const evaluation = await prisma.evaluationSAD.create({
      data: {
        userId: data.userId,
        term: data.term.trim(),
        score: new Prisma.Decimal(data.score),
        reportPdfUrl: data.reportPdfUrl,
        feedbackNotes: data.feedbackNotes?.trim() || null,
      },
    });

    return {
      id: evaluation.id,
      userId: evaluation.userId,
      term: evaluation.term,
      score: Number(evaluation.score),
      reportPdfUrl: evaluation.reportPdfUrl,
      feedbackNotes: evaluation.feedbackNotes,
      createdAt: evaluation.createdAt,
    };
  }
}
