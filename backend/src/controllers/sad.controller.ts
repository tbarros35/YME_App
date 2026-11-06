import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { SadService } from '../services/sad.service';

const createSadSchema = z.object({
  userId: z.string().uuid('ID de membro inválido'),
  term: z.string().min(3, 'O identificador do mandato é obrigatório (ex: 2025/2026 - Q1)'),
  score: z.coerce.number().min(0, 'A média do SAD não pode ser inferior a 0').max(6, 'A média do SAD não pode ser superior a 6'),
  feedbackNotes: z.string().optional(),
});

export class SadController {
  static async getMy(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const history = await SadService.getMyEvaluations(userId);
      res.status(200).json({ evaluations: history });
    } catch (error) {
      next(error);
    }
  }

  static async getUserSAD(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;
      const result = await SadService.getUserEvaluations(userId, req.user);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({
          error: {
            code: 'FILE_REQUIRED',
            message: 'O carregamento do relatório PDF da Avaliação SAD é obrigatório.',
          },
        });
        return;
      }

      const validated = createSadSchema.parse(req.body);
      const reportPdfUrl = `/uploads/sad/${req.file.filename}`;

      const evaluation = await SadService.createEvaluation(
        {
          userId: validated.userId,
          term: validated.term,
          score: validated.score,
          reportPdfUrl,
          feedbackNotes: validated.feedbackNotes,
        },
        req.user
      );

      res.status(201).json({
        message: 'Avaliação SAD registada com sucesso',
        evaluation,
      });
    } catch (error) {
      next(error);
    }
  }
}
