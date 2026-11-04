import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { WalletType, WalletRequestStatus, ReimbursementStatus } from '@prisma/client';
import { WalletService } from '../services/wallet.service';

const createTransactionSchema = z.object({
  userId: z.string().uuid('Invalid user ID format'),
  amount: z.number().refine((val) => val !== 0, 'Amount cannot be zero'),
  type: z.nativeEnum(WalletType, {
    errorMap: () => ({ message: 'Invalid wallet transaction type' }),
  }),
  description: z.string().min(3, 'Description must have at least 3 characters'),
});

const createWalletRequestSchema = z.object({
  amount: z.number().positive('O montante deve ser superior a zero'),
  justification: z.string().min(5, 'A justificação deve ter pelo menos 5 caracteres'),
});

const rejectRequestSchema = z.object({
  reason: z.string().optional(),
});

export class WalletController {
  static async getBalance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const type = req.query.type as WalletType | undefined;

      const result = await WalletService.getWalletDetails(userId, page, limit, type);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getUserWallet(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const type = req.query.type as WalletType | undefined;

      const result = await WalletService.getWalletDetails(userId, page, limit, type);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async createTransaction(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = createTransactionSchema.parse(req.body);
      const transaction = await WalletService.createTransaction(validated);

      res.status(201).json({
        message: 'Wallet transaction recorded successfully',
        transaction,
        data: transaction,
      });
    } catch (error) {
      next(error);
    }
  }

  static async createRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const validated = createWalletRequestSchema.parse(req.body);

      const request = await WalletService.createWalletRequest({
        userId,
        amount: validated.amount,
        justification: validated.justification,
      });

      res.status(201).json({
        message: 'Pedido de utilização de saldo submetido com sucesso',
        request,
        data: request,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getMyRequests(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const requests = await WalletService.getMyRequests(userId);
      res.status(200).json({
        requests,
        data: requests,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAllRequests(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const status = req.query.status as WalletRequestStatus | undefined;
      const requests = await WalletService.getAllRequests(status);
      res.status(200).json({
        requests,
        data: requests,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getPendingCount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const count = await WalletService.getPendingRequestsCount();
      res.status(200).json({
        count,
        data: { count },
      });
    } catch (error) {
      next(error);
    }
  }

  static async approveRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const reviewerId = req.user!.id;

      const result = await WalletService.approveRequest(id, reviewerId);
      res.status(200).json({
        message: 'Pedido de utilização aprovado e valor debitado com sucesso.',
        ...result,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async rejectRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const reviewerId = req.user!.id;
      const validated = rejectRequestSchema.parse(req.body);

      const result = await WalletService.rejectRequest(id, reviewerId, validated.reason);
      res.status(200).json({
        message: 'Pedido de utilização recusado. O saldo do membro permaneceu inalterado.',
        request: result,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  // ================= Reimbursement Endpoints (Compras para a YME) =================

  static async createReimbursement(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const amount = req.body.amount ? parseFloat(req.body.amount) : NaN;
      const justification = req.body.justification;

      if (isNaN(amount) || amount <= 0) {
        res.status(400).json({
          error: {
            code: 'INVALID_AMOUNT',
            message: 'O montante do reembolso deve ser um valor válido superior a 0,00 €.',
          },
        });
        return;
      }

      if (!justification || justification.trim().length < 5) {
        res.status(400).json({
          error: {
            code: 'JUSTIFICATION_REQUIRED',
            message: 'A justificação da despesa para a YME deve ter pelo menos 5 caracteres.',
          },
        });
        return;
      }

      if (!req.file) {
        res.status(400).json({
          error: {
            code: 'RECEIPT_REQUIRED',
            message: 'É obrigatório anexar o comprovativo da fatura (imagem ou PDF).',
          },
        });
        return;
      }

      const receiptUrl = `/uploads/receipts/${req.file.filename}`;

      const reimbursement = await WalletService.createReimbursementRequest({
        userId,
        amount,
        justification,
        receiptUrl,
      });

      res.status(201).json({
        message: 'Pedido de reembolso submetido com sucesso à Administração.',
        reimbursement,
        data: reimbursement,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getMyReimbursements(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const reimbursements = await WalletService.getMyReimbursements(userId);
      res.status(200).json({
        reimbursements,
        data: reimbursements,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAllReimbursements(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const status = req.query.status as ReimbursementStatus | undefined;
      const reimbursements = await WalletService.getAllReimbursements(status);
      res.status(200).json({
        reimbursements,
        data: reimbursements,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getPendingReimbursementsCount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const count = await WalletService.getPendingReimbursementsCount();
      res.status(200).json({
        count,
        data: { count },
      });
    } catch (error) {
      next(error);
    }
  }

  static async approveReimbursement(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const reviewerId = req.user!.id;

      if (!req.file) {
        res.status(400).json({
          error: {
            code: 'REFUND_PROOF_REQUIRED',
            message: 'O comprovativo da devolução de dinheiro (foto ou PDF) é obrigatório para confirmar a aprovação.',
          },
        });
        return;
      }

      const refundProofUrl = `/uploads/proofs/${req.file.filename}`;

      const result = await WalletService.approveReimbursement(id, reviewerId, refundProofUrl);
      res.status(200).json({
        message: 'Pedido de reembolso aprovado e comprovativo de devolução registado com sucesso.',
        reimbursement: result,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async rejectReimbursement(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const reviewerId = req.user!.id;
      const reason = req.body.reason;

      const result = await WalletService.rejectReimbursement(id, reviewerId, reason);
      res.status(200).json({
        message: 'Pedido de reembolso recusado com sucesso.',
        reimbursement: result,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}
