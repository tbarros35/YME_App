import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { TaskgroupService } from '../services/taskgroup.service';

const createTaskgroupSchema = z.object({
  name: z.string().min(2, 'O nome da taskgroup deve ter pelo menos 2 caracteres'),
});

export class TaskgroupController {
  static async getAll(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const taskgroups = await TaskgroupService.getAll();
      res.status(200).json({ taskgroups });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name } = createTaskgroupSchema.parse(req.body);
      const taskgroup = await TaskgroupService.create(name);
      res.status(201).json({
        message: 'Taskgroup criada com sucesso',
        taskgroup,
      });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const result = await TaskgroupService.delete(id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
