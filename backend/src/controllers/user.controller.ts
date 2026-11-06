import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Role, Taskgroup } from '@prisma/client';
import { UserService } from '../services/user.service';

const createUserSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'A palavra-passe deve ter pelo menos 6 caracteres'),
  fullName: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres'),
  departmentId: z.string().uuid('ID de departamento inválido'),
  position: z.string().min(2, 'O cargo é obrigatório'),
  role: z.nativeEnum(Role).optional(),
  taskgroups: z.array(z.nativeEnum(Taskgroup)).optional(),
  careerHistory: z.array(z.string()).optional(),
  highestPreviousPosition: z.enum(['NONE', 'TRAINEE', 'JUNIOR_CONSULTANT']).optional(),
  previousPositions: z.array(z.string()).optional(),
});

const updateUserSchema = z.object({
  fullName: z.string().min(3).optional(),
  departmentId: z.string().uuid().optional(),
  position: z.string().min(2).optional(),
  role: z.nativeEnum(Role).optional(),
  taskgroups: z.array(z.nativeEnum(Taskgroup)).optional(),
  careerHistory: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

const updatePasswordSchema = z.object({
  password: z.string().min(6, 'A nova palavra-passe deve ter pelo menos 6 caracteres'),
});

export class UserController {
  static async getAll(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const users = await UserService.getAllUsers();
      res.status(200).json({ users });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const user = await UserService.getUserById(id);
      res.status(200).json({ user });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = createUserSchema.parse(req.body);
      const user = await UserService.createUser({
        email: validated.email,
        passwordPlain: validated.password,
        fullName: validated.fullName,
        departmentId: validated.departmentId,
        position: validated.position,
        role: validated.role,
        taskgroups: validated.taskgroups,
        careerHistory: validated.careerHistory,
        highestPreviousPosition: validated.highestPreviousPosition,
        previousPositions: validated.previousPositions,
      });
      res.status(201).json({ message: 'Membro criado com sucesso', user });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const validated = updateUserSchema.parse(req.body);
      const user = await UserService.updateUser(id, validated);
      res.status(200).json({ message: 'Membro atualizado com sucesso', user });
    } catch (error) {
      next(error);
    }
  }

  static async updatePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const validated = updatePasswordSchema.parse(req.body);
      const result = await UserService.updateUserPassword(id, validated.password);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const result = await UserService.deleteUser(id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getDepartments(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const departments = await UserService.getDepartments();
      res.status(200).json({ departments });
    } catch (error) {
      next(error);
    }
  }

  static async getDashboardSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const summary = await UserService.getDashboardSummary(userId);
      res.status(200).json(summary);
    } catch (error) {
      next(error);
    }
  }
}
