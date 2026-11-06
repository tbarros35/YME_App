import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Role, CalendarCategory } from '@prisma/client';
import { env } from '../config/env';
import { prisma } from '../config/prisma';

export interface JwtPayload {
  userId: string;
  email: string;
  role: Role;
}

export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    let token: string | undefined;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication token missing or invalid',
        },
      });
      return;
    }

    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        departmentId: true,
        department: {
          select: {
            id: true,
            name: true,
          },
        },
        assignedDepartmentId: true,
        assignedDepartment: {
          select: {
            id: true,
            name: true,
          },
        },
        position: true,
        taskgroups: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'User account not found or inactive',
        },
      });
      return;
    }

    req.user = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      departmentId: user.departmentId,
      departmentName: user.department?.name,
      assignedDepartmentId: user.assignedDepartmentId,
      assignedDepartmentName: user.assignedDepartment?.name,
      position: user.position,
      taskgroups: user.taskgroups || [],
    };
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Access token expired',
        },
      });
      return;
    }
    res.status(401).json({
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid access token',
      },
    });
  }
};

export const requireRole = (...allowedRoles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: `Access denied. Requires one of roles: ${allowedRoles.join(', ')}`,
        },
      });
      return;
    }

    next();
  };
};

/**
 * Requirement: All members of Human Resources + Admins can submit SAD evaluations
 */
export const requireSadPermission = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    return;
  }

  const isAdmin = req.user.role === 'ADMIN';
  const isHR = req.user.departmentName === 'Human Resources';

  if (isAdmin || isHR) {
    next();
    return;
  }

  res.status(403).json({
    error: {
      code: 'FORBIDDEN',
      message: 'Apenas membros de Recursos Humanos ou Administradores podem lançar avaliações SAD.',
    },
  });
};

/**
 * Requirement: Head and Manager of Legal & Finance + Admins can manage member Wallets
 */
export const requireWalletPermission = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    return;
  }

  const isAdmin = req.user.role === 'ADMIN';
  const isLegalAndFinance = req.user.departmentName === 'Legal & Finance';
  const isHeadOrManager = req.user.position === 'Head' || req.user.position === 'Manager';

  if (isAdmin || (isLegalAndFinance && isHeadOrManager)) {
    next();
    return;
  }

  res.status(403).json({
    error: {
      code: 'FORBIDDEN',
      message: 'Apenas o Head e Manager de Legal & Finance ou Administradores podem alterar saldos e transações da Carteira.',
    },
  });
};

/**
 * Requirement: Admins + Any Member of Legal & Finance can review wallet usage requests
 */
export const requireWalletReviewPermission = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    return;
  }

  const isAdmin = req.user.role === 'ADMIN';
  const isLegalAndFinance = req.user.departmentName === 'Legal & Finance';

  if (isAdmin || isLegalAndFinance) {
    next();
    return;
  }

  res.status(403).json({
    error: {
      code: 'FORBIDDEN',
      message: 'Apenas Administradores ou membros de Legal & Finance podem aprovar ou recusar pedidos de utilização de saldo.',
    },
  });
};

/**
 * Requirement: Event scheduling permissions:
 * - Admin (Executive Board): Can schedule ANY category
 * - HR member: Can schedule ONLY 'HR_ACTIVITY'
 * - CSR Taskgroup member: Can schedule ONLY 'CSR_ACTIVITY'
 * - Partnerships Taskgroup member: Can schedule ONLY 'OPEN_DAY'
 * - Legal & Finance / others: CANNOT schedule any events
 */
export const requireCalendarCreatePermission = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    return;
  }

  const user = req.user;
  const isAdmin = user.role === 'ADMIN';
  const isHR = user.departmentName === 'Human Resources';
  const isCSR = user.taskgroups?.some((t) => t.toUpperCase() === 'CSR');
  const isPartnerships = user.taskgroups?.some((t) => t.toUpperCase() === 'PARTNERSHIPS');

  // Compute allowed categories for this user
  const allowedCategories: CalendarCategory[] = [];
  if (isAdmin) {
    allowedCategories.push(
      'GENERAL_ASSEMBLY',
      'GENERAL_MEETING',
      'FORMATION',
      'HR_ACTIVITY',
      'CSR_ACTIVITY',
      'OPEN_DAY',
      'OTHER'
    );
  } else {
    if (isHR) allowedCategories.push('HR_ACTIVITY');
    if (isCSR) allowedCategories.push('CSR_ACTIVITY');
    if (isPartnerships) allowedCategories.push('OPEN_DAY');
  }

  if (allowedCategories.length === 0) {
    res.status(403).json({
      error: {
        code: 'FORBIDDEN',
        message: 'Não tens permissão para agendar eventos no calendário associativo.',
      },
    });
    return;
  }

  const requestedCategory = req.body.category as CalendarCategory | undefined;
  if (requestedCategory && !allowedCategories.includes(requestedCategory)) {
    res.status(403).json({
      error: {
        code: 'FORBIDDEN',
        message: `Não tens permissão para agendar eventos da categoria "${requestedCategory}". Categorias permitidas: ${allowedCategories.join(', ')}`,
      },
    });
    return;
  }

  next();
};
