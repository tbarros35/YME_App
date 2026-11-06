import { prisma } from '../config/prisma';
import { SupportCategory, SupportStatus } from '@prisma/client';

export interface AuthenticatedUserContext {
  id: string;
  email: string;
  fullName: string;
  role: string;
  departmentName?: string;
  departmentId?: string;
  assignedDepartmentId?: string | null;
  assignedDepartmentName?: string;
  position?: string;
}

export class SupportService {
  /**
   * Helper to verify if user has permission to access a specific ticket:
   * - Creator: Always can access
   * - Admin (Executive Board: CEO, COO, CMO): Universal access
   * - Legal & Finance: ONLY Head and Manager have access to WALLET tickets
   * - Human Resources:
   *     - Head & Manager: All SAD tickets
   *     - Trainee, Junior, Senior Consultant: Only SAD tickets for members in their assigned department
   * - Other: Only Admin and creator
   */
  static canUserAccessTicket(
    user: AuthenticatedUserContext,
    ticket: {
      userId: string;
      category: SupportCategory;
      user?: {
        departmentId?: string;
        department?: { id: string; name: string };
      };
    }
  ): boolean {
    // 1. Creator always has access to their own ticket
    if (ticket.userId === user.id) return true;

    // 2. Admins (Executive Board) have universal access to all tickets
    if (user.role === 'ADMIN') return true;

    const isLegal = user.departmentName === 'Legal & Finance';
    const isHR = user.departmentName === 'Human Resources';
    const pos = (user.position || '').trim();
    const isLeadership = pos === 'Head' || pos === 'Manager';

    // 3. Wallet tickets: Only Head and Manager of Legal & Finance (and Admins) have access
    if (ticket.category === 'WALLET') {
      if (isLegal && isLeadership) return true;
      return false; // Trainees, Junior, Senior of Legal & Finance have NO access
    }

    // 4. SAD tickets:
    if (ticket.category === 'SAD_EVALUATION') {
      if (isHR) {
        // Head and Manager of HR have access to all SAD tickets
        if (isLeadership) return true;

        // Non-leadership HR members (Trainee, Junior, Senior) must be allocated to the ticket creator's department
        const ticketCreatorDeptId = ticket.user?.departmentId || ticket.user?.department?.id;
        if (
          user.assignedDepartmentId &&
          ticketCreatorDeptId &&
          user.assignedDepartmentId === ticketCreatorDeptId
        ) {
          return true;
        }
      }
      return false;
    }

    // 5. General / Other tickets: only Admin and ticket creator
    return false;
  }

  /**
   * Create a new support ticket with an initial message
   */
  static async createTicket(
    userId: string,
    data: {
      category: SupportCategory;
      message: string;
      subject?: string;
    }
  ) {
    if (!['SAD_EVALUATION', 'WALLET', 'OTHER'].includes(data.category)) {
      const error: any = new Error('Categoria de suporte inválida');
      error.statusCode = 400;
      error.code = 'INVALID_CATEGORY';
      throw error;
    }

    if (!data.message || !data.message.trim()) {
      const error: any = new Error('A mensagem explicativa é obrigatória');
      error.statusCode = 400;
      error.code = 'MESSAGE_REQUIRED';
      throw error;
    }

    let defaultSubject = 'Dúvida ou Pedido de Suporte';
    if (data.category === 'SAD_EVALUATION') defaultSubject = 'Dúvida sobre Avaliação SAD';
    if (data.category === 'WALLET') defaultSubject = 'Dúvida sobre Carteira YME';
    if (data.category === 'OTHER') defaultSubject = 'Assunto Geral / Apoio Direção';

    const subject = data.subject?.trim() || defaultSubject;

    const ticket = await prisma.supportTicket.create({
      data: {
        userId,
        category: data.category,
        subject,
        status: SupportStatus.OPEN,
        messages: {
          create: {
            senderId: userId,
            content: data.message.trim(),
          },
        },
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
            position: true,
            departmentId: true,
            department: { select: { id: true, name: true } },
          },
        },
        messages: {
          include: {
            sender: {
              select: {
                id: true,
                fullName: true,
                role: true,
                position: true,
                department: { select: { id: true, name: true } },
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    return ticket;
  }

  /**
   * Get tickets created by the logged-in user
   */
  static async getMyTickets(userId: string) {
    const tickets = await prisma.supportTicket.findMany({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
            position: true,
            departmentId: true,
            department: { select: { id: true, name: true } },
          },
        },
        messages: {
          include: {
            sender: {
              select: {
                id: true,
                fullName: true,
                role: true,
                position: true,
                department: { select: { id: true, name: true } },
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return tickets;
  }

  /**
   * Get tickets assigned to staff based on department, role, and allocation:
   * - Admin: ALL tickets
   * - Legal & Finance: ONLY Head & Manager (WALLET tickets)
   * - HR: Head & Manager (ALL SAD tickets); Trainee/Junior/Senior (ONLY SAD tickets for their assigned department)
   */
  static async getAssignedTickets(user: AuthenticatedUserContext) {
    const isAdmin = user.role === 'ADMIN';
    const isHR = user.departmentName === 'Human Resources';
    const isLegal = user.departmentName === 'Legal & Finance';
    const pos = (user.position || '').trim();
    const isLeadership = pos === 'Head' || pos === 'Manager';

    if (!isAdmin && !isHR && !(isLegal && isLeadership)) {
      return [];
    }

    const whereClause: any = {};
    if (!isAdmin) {
      if (isLegal && isLeadership) {
        whereClause.category = 'WALLET';
      } else if (isHR) {
        whereClause.category = 'SAD_EVALUATION';
        if (!isLeadership) {
          // Non-leadership HR member (Trainee, Junior, Senior) only sees SAD tickets for members in their assigned department
          if (!user.assignedDepartmentId) {
            return [];
          }
          whereClause.user = {
            departmentId: user.assignedDepartmentId,
          };
        }
      }
    }

    const tickets = await prisma.supportTicket.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
            position: true,
            departmentId: true,
            department: { select: { id: true, name: true } },
          },
        },
        messages: {
          include: {
            sender: {
              select: {
                id: true,
                fullName: true,
                role: true,
                position: true,
                department: { select: { id: true, name: true } },
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return tickets;
  }

  /**
   * Get ticket details by ID with permission verification
   */
  static async getTicketById(ticketId: string, user: AuthenticatedUserContext) {
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
            position: true,
            departmentId: true,
            department: { select: { id: true, name: true } },
          },
        },
        messages: {
          include: {
            sender: {
              select: {
                id: true,
                fullName: true,
                role: true,
                position: true,
                department: { select: { id: true, name: true } },
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!ticket) {
      const error: any = new Error('Ticket de suporte não encontrado');
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }

    if (!this.canUserAccessTicket(user, ticket)) {
      const error: any = new Error('Não tens permissão para aceder a este ticket de suporte');
      error.statusCode = 403;
      error.code = 'FORBIDDEN';
      throw error;
    }

    return ticket;
  }

  /**
   * Add a message to an existing ticket chat
   */
  static async addMessage(ticketId: string, user: AuthenticatedUserContext, content: string) {
    if (!content || !content.trim()) {
      const error: any = new Error('O conteúdo da mensagem não pode ser vazio');
      error.statusCode = 400;
      error.code = 'EMPTY_MESSAGE';
      throw error;
    }

    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: {
        user: {
          select: {
            id: true,
            departmentId: true,
            department: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!ticket) {
      const error: any = new Error('Ticket de suporte não encontrado');
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }

    if (!this.canUserAccessTicket(user, ticket)) {
      const error: any = new Error('Não tens permissão para responder a este ticket');
      error.statusCode = 403;
      error.code = 'FORBIDDEN';
      throw error;
    }

    // Determine status update: if staff replies to an open ticket, set to IN_PROGRESS
    let newStatus = ticket.status;
    const isStaffReply = user.id !== ticket.userId;
    if (isStaffReply && ticket.status === SupportStatus.OPEN) {
      newStatus = SupportStatus.IN_PROGRESS;
    }

    const [message] = await prisma.$transaction([
      prisma.supportMessage.create({
        data: {
          ticketId,
          senderId: user.id,
          content: content.trim(),
        },
        include: {
          sender: {
            select: {
              id: true,
              fullName: true,
              role: true,
              position: true,
              department: { select: { id: true, name: true } },
            },
          },
        },
      }),
      prisma.supportTicket.update({
        where: { id: ticketId },
        data: {
          status: newStatus,
          updatedAt: new Date(),
        },
      }),
    ]);

    return message;
  }

  /**
   * Update status of a ticket
   */
  static async updateStatus(ticketId: string, user: AuthenticatedUserContext, status: SupportStatus) {
    if (!['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].includes(status)) {
      const error: any = new Error('Estado de suporte inválido');
      error.statusCode = 400;
      error.code = 'INVALID_STATUS';
      throw error;
    }

    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: {
        user: {
          select: {
            id: true,
            departmentId: true,
            department: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!ticket) {
      const error: any = new Error('Ticket de suporte não encontrado');
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }

    if (!this.canUserAccessTicket(user, ticket)) {
      const error: any = new Error('Não tens permissão para alterar o estado deste ticket');
      error.statusCode = 403;
      error.code = 'FORBIDDEN';
      throw error;
    }

    const updated = await prisma.supportTicket.update({
      where: { id: ticketId },
      data: { status },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
            position: true,
            departmentId: true,
            department: { select: { id: true, name: true } },
          },
        },
        messages: {
          include: {
            sender: {
              select: {
                id: true,
                fullName: true,
                role: true,
                position: true,
                department: { select: { id: true, name: true } },
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    return updated;
  }
}
