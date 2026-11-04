import { prisma } from '../config/prisma';
import { Prisma, WalletType, WalletRequestStatus, ReimbursementStatus } from '@prisma/client';

export class WalletService {
  static async getUserBalance(userId: string): Promise<number> {
    const transactions = await prisma.walletTransaction.findMany({
      where: { userId },
      select: { amount: true },
    });
    const total = transactions.reduce((acc, t) => acc + Number(t.amount), 0);
    return Number(total.toFixed(2));
  }

  static async getWalletDetails(
    userId: string,
    page: number = 1,
    limit: number = 20,
    typeFilter?: WalletType
  ) {
    const pageNumber = Math.max(1, page);
    const pageSize = Math.max(1, Math.min(100, limit));
    const skip = (pageNumber - 1) * pageSize;

    // 1. Calculate computed balance (SUM of all amounts for user)
    const allTransactions = await prisma.walletTransaction.findMany({
      where: { userId },
      select: { amount: true },
    });

    let totalBalance = 0;
    let totalEarnings = 0;
    let totalSpendings = 0;

    for (const tx of allTransactions) {
      const val = Number(tx.amount);
      totalBalance += val;
      if (val > 0) {
        totalEarnings += val;
      } else {
        totalSpendings += Math.abs(val);
      }
    }

    // 2. Fetch paginated transactions
    const whereClause: Prisma.WalletTransactionWhereInput = {
      userId,
      ...(typeFilter ? { type: typeFilter } : {}),
    };

    const [totalTransactions, transactions] = await Promise.all([
      prisma.walletTransaction.count({ where: whereClause }),
      prisma.walletTransaction.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
    ]);

    const result = {
      balance: Number(totalBalance.toFixed(2)),
      totalEarnings: Number(totalEarnings.toFixed(2)),
      totalSpendings: Number(totalSpendings.toFixed(2)),
      pagination: {
        page: pageNumber,
        limit: pageSize,
        totalItems: totalTransactions,
        totalPages: Math.ceil(totalTransactions / pageSize),
      },
      transactions: transactions.map((t) => ({
        id: t.id,
        userId: t.userId,
        amount: Number(t.amount),
        type: t.type,
        description: t.description,
        createdAt: t.createdAt,
      })),
    };

    return {
      ...result,
      data: result,
    };
  }

  static async createTransaction(data: {
    userId: string;
    amount: number;
    type: WalletType;
    description: string;
  }) {
    const user = await prisma.user.findUnique({
      where: { id: data.userId },
    });

    if (!user) {
      const error: any = new Error('Member not found');
      error.statusCode = 404;
      error.code = 'USER_NOT_FOUND';
      throw error;
    }

    // For EVENT_SPEND, make sure amount is negative if entered as positive
    let adjustedAmount = data.amount;
    if (data.type === WalletType.EVENT_SPEND && adjustedAmount > 0) {
      adjustedAmount = -adjustedAmount;
    }

    const transaction = await prisma.walletTransaction.create({
      data: {
        userId: data.userId,
        amount: new Prisma.Decimal(adjustedAmount),
        type: data.type,
        description: data.description,
      },
    });

    return {
      id: transaction.id,
      userId: transaction.userId,
      amount: Number(transaction.amount),
      type: transaction.type,
      description: transaction.description,
      createdAt: transaction.createdAt,
    };
  }

  static async createWalletRequest(data: {
    userId: string;
    amount: number;
    justification: string;
  }) {
    const user = await prisma.user.findUnique({
      where: { id: data.userId },
    });

    if (!user) {
      const error: any = new Error('Membro não encontrado.');
      error.statusCode = 404;
      error.code = 'USER_NOT_FOUND';
      throw error;
    }

    if (!data.amount || data.amount <= 0) {
      const error: any = new Error('O montante solicitado deve ser superior a 0,00 €.');
      error.statusCode = 400;
      error.code = 'INVALID_AMOUNT';
      throw error;
    }

    const currentBalance = await this.getUserBalance(data.userId);
    if (data.amount > currentBalance) {
      const error: any = new Error(
        `Saldo insuficiente. O montante solicitado (${data.amount.toFixed(2)} €) é superior ao teu saldo disponível (${currentBalance.toFixed(2)} €).`
      );
      error.statusCode = 400;
      error.code = 'INSUFFICIENT_FUNDS';
      throw error;
    }

    if (!data.justification || data.justification.trim().length < 5) {
      const error: any = new Error(
        'Por favor indica uma justificação detalhada com pelo menos 5 caracteres sobre o efeito para o qual pretendes utilizar o dinheiro.'
      );
      error.statusCode = 400;
      error.code = 'JUSTIFICATION_REQUIRED';
      throw error;
    }

    const request = await prisma.walletRequest.create({
      data: {
        userId: data.userId,
        amount: new Prisma.Decimal(data.amount),
        justification: data.justification.trim(),
        status: 'PENDING',
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            position: true,
            department: { select: { name: true } },
          },
        },
      },
    });

    return {
      id: request.id,
      userId: request.userId,
      amount: Number(request.amount),
      justification: request.justification,
      status: request.status,
      createdAt: request.createdAt,
      user: request.user,
    };
  }

  static async getMyRequests(userId: string) {
    const requests = await prisma.walletRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        reviewedBy: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    return requests.map((r) => ({
      id: r.id,
      userId: r.userId,
      amount: Number(r.amount),
      justification: r.justification,
      status: r.status,
      rejectionReason: r.rejectionReason,
      reviewedById: r.reviewedById,
      reviewedBy: r.reviewedBy,
      reviewedAt: r.reviewedAt,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));
  }

  static async getAllRequests(statusFilter?: WalletRequestStatus) {
    const whereClause: Prisma.WalletRequestWhereInput = statusFilter
      ? { status: statusFilter }
      : {};

    const requests = await prisma.walletRequest.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            position: true,
            department: { select: { name: true } },
          },
        },
        reviewedBy: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    const userIds = [...new Set(requests.map((r) => r.userId))];
    const userBalances = new Map<string, number>();

    await Promise.all(
      userIds.map(async (uId) => {
        const bal = await this.getUserBalance(uId);
        userBalances.set(uId, bal);
      })
    );

    return requests.map((r) => ({
      id: r.id,
      userId: r.userId,
      amount: Number(r.amount),
      justification: r.justification,
      status: r.status,
      rejectionReason: r.rejectionReason,
      reviewedById: r.reviewedById,
      reviewedBy: r.reviewedBy,
      reviewedAt: r.reviewedAt,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      user: r.user,
      currentMemberBalance: userBalances.get(r.userId) ?? 0,
    }));
  }

  static async getPendingRequestsCount(): Promise<number> {
    return prisma.walletRequest.count({
      where: { status: 'PENDING' },
    });
  }

  static async approveRequest(requestId: string, reviewerId: string) {
    return prisma.$transaction(async (tx) => {
      const request = await tx.walletRequest.findUnique({
        where: { id: requestId },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
      });

      if (!request) {
        const error: any = new Error('Pedido de utilização não encontrado.');
        error.statusCode = 404;
        error.code = 'NOT_FOUND';
        throw error;
      }

      if (request.status !== 'PENDING') {
        const error: any = new Error(
          `Este pedido já foi ${request.status === 'APPROVED' ? 'aprovado' : 'recusado'} anteriormente.`
        );
        error.statusCode = 400;
        error.code = 'REQUEST_ALREADY_PROCESSED';
        throw error;
      }

      const txs = await tx.walletTransaction.findMany({
        where: { userId: request.userId },
        select: { amount: true },
      });
      const currentBalance = txs.reduce((sum, t) => sum + Number(t.amount), 0);
      const reqAmount = Number(request.amount);

      if (reqAmount > currentBalance) {
        const error: any = new Error(
          `Saldo insuficiente: O membro dispõe atualmente de ${currentBalance.toFixed(2)} €, mas o montante requerido é de ${reqAmount.toFixed(2)} €.`
        );
        error.statusCode = 400;
        error.code = 'INSUFFICIENT_FUNDS';
        throw error;
      }

      // 1. Mark request as APPROVED
      const updatedRequest = await tx.walletRequest.update({
        where: { id: requestId },
        data: {
          status: 'APPROVED',
          reviewedById: reviewerId,
          reviewedAt: new Date(),
        },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
          reviewedBy: {
            select: {
              id: true,
              fullName: true,
            },
          },
        },
      });

      // 2. Deduct money from member's wallet
      const transaction = await tx.walletTransaction.create({
        data: {
          userId: request.userId,
          amount: new Prisma.Decimal(-reqAmount),
          type: WalletType.EVENT_SPEND,
          description: `Utilização de saldo aprovada: ${request.justification}`,
        },
      });

      return {
        request: {
          id: updatedRequest.id,
          userId: updatedRequest.userId,
          amount: Number(updatedRequest.amount),
          justification: updatedRequest.justification,
          status: updatedRequest.status,
          reviewedBy: updatedRequest.reviewedBy,
          reviewedAt: updatedRequest.reviewedAt,
          updatedAt: updatedRequest.updatedAt,
        },
        transaction: {
          id: transaction.id,
          amount: Number(transaction.amount),
          type: transaction.type,
          description: transaction.description,
          createdAt: transaction.createdAt,
        },
      };
    });
  }

  static async rejectRequest(requestId: string, reviewerId: string, reason?: string) {
    const request = await prisma.walletRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      const error: any = new Error('Pedido de utilização não encontrado.');
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }

    if (request.status !== 'PENDING') {
      const error: any = new Error(
        `Este pedido já foi ${request.status === 'APPROVED' ? 'aprovado' : 'recusado'} anteriormente.`
      );
      error.statusCode = 400;
      error.code = 'REQUEST_ALREADY_PROCESSED';
      throw error;
    }

    // Mark as REJECTED - Money stays in member's account!
    const updatedRequest = await prisma.walletRequest.update({
      where: { id: requestId },
      data: {
        status: 'REJECTED',
        rejectionReason: reason?.trim() || 'Pedido de utilização recusado pela Direção / Legal.',
        reviewedById: reviewerId,
        reviewedAt: new Date(),
      },
      include: {
        reviewedBy: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    return {
      id: updatedRequest.id,
      userId: updatedRequest.userId,
      amount: Number(updatedRequest.amount),
      justification: updatedRequest.justification,
      status: updatedRequest.status,
      rejectionReason: updatedRequest.rejectionReason,
      reviewedBy: updatedRequest.reviewedBy,
      reviewedAt: updatedRequest.reviewedAt,
      updatedAt: updatedRequest.updatedAt,
    };
  }

  // ================= Reimbursement Requests (Compras para a YME) =================

  static async createReimbursementRequest(data: {
    userId: string;
    amount: number;
    justification: string;
    receiptUrl: string;
  }) {
    const user = await prisma.user.findUnique({
      where: { id: data.userId },
    });

    if (!user) {
      const error: any = new Error('Membro não encontrado.');
      error.statusCode = 404;
      error.code = 'USER_NOT_FOUND';
      throw error;
    }

    if (!data.amount || data.amount <= 0) {
      const error: any = new Error('O montante do reembolso deve ser superior a 0,00 €.');
      error.statusCode = 400;
      error.code = 'INVALID_AMOUNT';
      throw error;
    }

    if (!data.justification || data.justification.trim().length < 5) {
      const error: any = new Error(
        'Por favor indica uma justificação detalhada com pelo menos 5 caracteres sobre o efeito da despesa realizada para a YME.'
      );
      error.statusCode = 400;
      error.code = 'JUSTIFICATION_REQUIRED';
      throw error;
    }

    if (!data.receiptUrl) {
      const error: any = new Error('É obrigatório anexar o comprovativo / fatura da despesa (PDF ou imagem).');
      error.statusCode = 400;
      error.code = 'RECEIPT_REQUIRED';
      throw error;
    }

    const request = await prisma.reimbursementRequest.create({
      data: {
        userId: data.userId,
        amount: new Prisma.Decimal(data.amount),
        justification: data.justification.trim(),
        receiptUrl: data.receiptUrl,
        status: 'PENDING',
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            position: true,
            department: { select: { name: true } },
          },
        },
      },
    });

    return {
      id: request.id,
      userId: request.userId,
      amount: Number(request.amount),
      justification: request.justification,
      receiptUrl: request.receiptUrl,
      status: request.status,
      createdAt: request.createdAt,
      user: request.user,
    };
  }

  static async getMyReimbursements(userId: string) {
    const requests = await prisma.reimbursementRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        reviewedBy: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    return requests.map((r) => ({
      id: r.id,
      userId: r.userId,
      amount: Number(r.amount),
      justification: r.justification,
      receiptUrl: r.receiptUrl,
      refundProofUrl: r.refundProofUrl,
      status: r.status,
      rejectionReason: r.rejectionReason,
      reviewedById: r.reviewedById,
      reviewedBy: r.reviewedBy,
      reviewedAt: r.reviewedAt,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));
  }

  static async getAllReimbursements(statusFilter?: ReimbursementStatus) {
    const whereClause: Prisma.ReimbursementRequestWhereInput = statusFilter
      ? { status: statusFilter }
      : {};

    const requests = await prisma.reimbursementRequest.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            position: true,
            department: { select: { name: true } },
          },
        },
        reviewedBy: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    return requests.map((r) => ({
      id: r.id,
      userId: r.userId,
      amount: Number(r.amount),
      justification: r.justification,
      receiptUrl: r.receiptUrl,
      refundProofUrl: r.refundProofUrl,
      status: r.status,
      rejectionReason: r.rejectionReason,
      reviewedById: r.reviewedById,
      reviewedBy: r.reviewedBy,
      reviewedAt: r.reviewedAt,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      user: r.user,
    }));
  }

  static async getPendingReimbursementsCount(): Promise<number> {
    return prisma.reimbursementRequest.count({
      where: { status: 'PENDING' },
    });
  }

  static async approveReimbursement(requestId: string, reviewerId: string, refundProofUrl: string) {
    if (!refundProofUrl) {
      const error: any = new Error(
        'O comprovativo da devolução de dinheiro (foto ou PDF) é obrigatório para confirmar a aprovação do reembolso.'
      );
      error.statusCode = 400;
      error.code = 'REFUND_PROOF_REQUIRED';
      throw error;
    }

    const request = await prisma.reimbursementRequest.findUnique({
      where: { id: requestId },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    if (!request) {
      const error: any = new Error('Pedido de reembolso não encontrado.');
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }

    if (request.status !== 'PENDING') {
      const error: any = new Error(
        `Este pedido de reembolso já foi ${request.status === 'APPROVED' ? 'aprovado' : 'recusado'} anteriormente.`
      );
      error.statusCode = 400;
      error.code = 'REQUEST_ALREADY_PROCESSED';
      throw error;
    }

    const updatedRequest = await prisma.reimbursementRequest.update({
      where: { id: requestId },
      data: {
        status: 'APPROVED',
        refundProofUrl,
        reviewedById: reviewerId,
        reviewedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        reviewedBy: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    return {
      id: updatedRequest.id,
      userId: updatedRequest.userId,
      amount: Number(updatedRequest.amount),
      justification: updatedRequest.justification,
      receiptUrl: updatedRequest.receiptUrl,
      refundProofUrl: updatedRequest.refundProofUrl,
      status: updatedRequest.status,
      reviewedBy: updatedRequest.reviewedBy,
      reviewedAt: updatedRequest.reviewedAt,
      updatedAt: updatedRequest.updatedAt,
      user: updatedRequest.user,
    };
  }

  static async rejectReimbursement(requestId: string, reviewerId: string, reason?: string) {
    const request = await prisma.reimbursementRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      const error: any = new Error('Pedido de reembolso não encontrado.');
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }

    if (request.status !== 'PENDING') {
      const error: any = new Error(
        `Este pedido de reembolso já foi ${request.status === 'APPROVED' ? 'aprovado' : 'recusado'} anteriormente.`
      );
      error.statusCode = 400;
      error.code = 'REQUEST_ALREADY_PROCESSED';
      throw error;
    }

    const updatedRequest = await prisma.reimbursementRequest.update({
      where: { id: requestId },
      data: {
        status: 'REJECTED',
        rejectionReason: reason?.trim() || 'Pedido de reembolso recusado pela Administração.',
        reviewedById: reviewerId,
        reviewedAt: new Date(),
      },
      include: {
        reviewedBy: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    return {
      id: updatedRequest.id,
      userId: updatedRequest.userId,
      amount: Number(updatedRequest.amount),
      justification: updatedRequest.justification,
      receiptUrl: updatedRequest.receiptUrl,
      refundProofUrl: updatedRequest.refundProofUrl,
      status: updatedRequest.status,
      rejectionReason: updatedRequest.rejectionReason,
      reviewedBy: updatedRequest.reviewedBy,
      reviewedAt: updatedRequest.reviewedAt,
      updatedAt: updatedRequest.updatedAt,
    };
  }
}
