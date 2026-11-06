import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { TimelineCategory } from '@prisma/client';
import { TimelineService } from '../services/timeline.service';

const createTimelineSchema = z.object({
  userId: z.string().uuid('Invalid user ID format'),
  title: z.string().min(2, 'Title is required'),
  category: z.nativeEnum(TimelineCategory, {
    errorMap: () => ({ message: 'Invalid timeline category' }),
  }),
  description: z.string().optional(),
  roleStep: z.string().min(2, 'O cargo associado ao marco é obrigatório').optional(),
  eventDate: z.string().min(4, 'Valid event date string or ISO format required'),
});

export class TimelineController {
  static async getMy(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const timeline = await TimelineService.getMyTimeline(userId);
      res.status(200).json({ timeline });
    } catch (error) {
      next(error);
    }
  }

  static async getUserTimeline(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;
      const timeline = await TimelineService.getMyTimeline(userId);
      res.status(200).json({ timeline });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = createTimelineSchema.parse(req.body);
      const event = await TimelineService.createTimelineEvent(validated);

      res.status(201).json({
        message: 'Timeline milestone created successfully',
        event,
      });
    } catch (error) {
      next(error);
    }
  }
}
