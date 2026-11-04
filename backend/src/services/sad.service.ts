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

  static async getUserEvaluations(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, fullName: true, email: true },
    });

    if (!user) {
      const error: any = new Error('Membro não encontrado');
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }

    const evaluations = await prisma.evaluationSAD.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return {
      user,
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

  static async createEvaluation(data: {
    userId: string;
    term: string;
    score: number;
    reportPdfUrl: string;
    feedbackNotes?: string;
  }) {
    const user = await prisma.user.findUnique({
      where: { id: data.userId },
    });

    if (!user) {
      const error: any = new Error('Membro não encontrado');
      error.statusCode = 404;
      error.code = 'USER_NOT_FOUND';
      throw error;
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
