import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { SupportService } from '../services/support.service';
import { SupportCategory, SupportStatus } from '@prisma/client';

const createTicketSchema = z.object({
  category: z.enum(['SAD_EVALUATION', 'WALLET', 'OTHER'], {
    errorMap: () => ({ message: 'Categoria de suporte inválida. Escolha: SAD_EVALUATION, WALLET ou OTHER' }),
  }),
  message: z.string().min(3, 'Por favor adiciona uma descrição com pelo menos 3 caracteres'),
  subject: z.string().optional(),
});

const addMessageSchema = z.object({
  content: z.string().min(1, 'A mensagem não pode estar vazia'),
});

const updateStatusSchema = z.object({
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'], {
    errorMap: () => ({ message: 'Estado inválido' }),
  }),
});

export class SupportController {
  /**
   * Create a new ticket (any member)
   */
  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = createTicketSchema.parse(req.body);
      const userId = req.user!.id;

      const ticket = await SupportService.createTicket(userId, {
        category: validated.category as SupportCategory,
        message: validated.message,
        subject: validated.subject,
      });

      res.status(201).json({
        message: 'Pedido de suporte criado com sucesso',
        ticket,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get tickets created by the logged in user
   */
  static async getMy(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const tickets = await SupportService.getMyTickets(userId);
      res.status(200).json({ tickets });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get assigned tickets for staff queue (Backoffice)
   */
  static async getAssigned(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      const tickets = await SupportService.getAssignedTickets(user);
      res.status(200).json({ tickets });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get a ticket by ID with full chat thread
   */
  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const user = req.user!;
      const ticket = await SupportService.getTicketById(id, user);
      res.status(200).json({ ticket });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Add a message to an existing ticket chat
   */
  static async addMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const validated = addMessageSchema.parse(req.body);
      const user = req.user!;

      const message = await SupportService.addMessage(id, user, validated.content);
      res.status(201).json({
        message: 'Mensagem enviada com sucesso',
        data: message,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update status of a ticket
   */
  static async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const validated = updateStatusSchema.parse(req.body);
      const user = req.user!;

      const ticket = await SupportService.updateStatus(id, user, validated.status as SupportStatus);
      res.status(200).json({
        message: 'Estado do ticket atualizado com sucesso',
        ticket,
      });
    } catch (error) {
      next(error);
    }
  }
}
