import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { CalendarCategory } from '@prisma/client';
import { CalendarService } from '../services/calendar.service';

const createCalendarSchema = z.object({
  title: z.string().min(3, 'Title must have at least 3 characters'),
  description: z.string().optional(),
  category: z.nativeEnum(CalendarCategory, {
    errorMap: () => ({ message: 'Invalid calendar category' }),
  }),
  startTime: z.string().min(5, 'Valid start time required'),
  endTime: z.string().min(5, 'Valid end time required'),
  location: z.string().optional(),
});

export class CalendarController {
  static async getEvents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const category = req.query.category as CalendarCategory | undefined;
      const month = req.query.month ? parseInt(req.query.month as string, 10) : undefined;
      const year = req.query.year ? parseInt(req.query.year as string, 10) : undefined;

      const events = await CalendarService.getEvents({ category, month, year });
      res.status(200).json({ events });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = createCalendarSchema.parse(req.body);
      const event = await CalendarService.createEvent(validated);

      res.status(201).json({
        message: 'Calendar event created successfully',
        event,
      });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const result = await CalendarService.deleteEvent(id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
