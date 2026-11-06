import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma';
import { env } from '../config/env';
import { resolveCareerHistory } from './user.service';

export class AuthService {
  static async login(email: string, passwordPlain: string) {
    const normalizedEmail = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        department: {
          select: {
            id: true,
            name: true,
          },
        },
        assignedDepartment: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!user || !user.isActive) {
      const error: any = new Error('Email ou palavra-passe incorretos');
      error.statusCode = 401;
      error.code = 'INVALID_CREDENTIALS';
      throw error;
    }

    const isMatch = await bcrypt.compare(passwordPlain, user.passwordHash);
    if (!isMatch) {
      const error: any = new Error('Email ou palavra-passe incorretos');
      error.statusCode = 401;
      error.code = 'INVALID_CREDENTIALS';
      throw error;
    }

    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: '15m',
    });

    const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, {
      expiresIn: '7d',
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        departmentId: user.departmentId,
        department: user.department,
        assignedDepartmentId: user.assignedDepartmentId,
        assignedDepartment: user.assignedDepartment,
        position: user.position,
        careerHistory: resolveCareerHistory(user),
        taskgroups: user.taskgroups || [],
      },
      accessToken,
      refreshToken,
    };
  }

  static async refresh(refreshToken: string) {
    try {
      const decoded: any = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET);

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        include: {
          department: {
            select: { id: true, name: true },
          },
          assignedDepartment: {
            select: { id: true, name: true },
          },
        },
      });

      if (!user || !user.isActive) {
        const error: any = new Error('Utilizador não encontrado ou inativo');
        error.statusCode = 401;
        error.code = 'UNAUTHORIZED';
        throw error;
      }

      const payload = {
        userId: user.id,
        email: user.email,
        role: user.role,
      };

      const newAccessToken = jwt.sign(payload, env.JWT_SECRET, {
        expiresIn: '15m',
      });

      const newRefreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, {
        expiresIn: '7d',
      });

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          departmentId: user.departmentId,
          department: user.department,
          assignedDepartmentId: user.assignedDepartmentId,
          assignedDepartment: user.assignedDepartment,
          position: user.position,
          careerHistory: resolveCareerHistory(user),
          taskgroups: user.taskgroups || [],
        },
      };
    } catch (err) {
      const error: any = new Error('Sessão expirada ou token inválido');
      error.statusCode = 401;
      error.code = 'INVALID_REFRESH_TOKEN';
      throw error;
    }
  }

  static async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        department: {
          select: {
            id: true,
            name: true,
          },
        },
        assignedDepartment: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!user) {
      const error: any = new Error('Utilizador não encontrado');
      error.statusCode = 404;
      error.code = 'USER_NOT_FOUND';
      throw error;
    }

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      departmentId: user.departmentId,
      department: user.department,
      assignedDepartmentId: user.assignedDepartmentId,
      assignedDepartment: user.assignedDepartment,
      position: user.position,
      careerHistory: resolveCareerHistory(user),
      taskgroups: user.taskgroups || [],
      isActive: user.isActive,
      createdAt: user.createdAt,
    };
  }
}
