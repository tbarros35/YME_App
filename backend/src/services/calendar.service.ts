import { prisma } from '../config/prisma';
import { CalendarCategory, Prisma } from '@prisma/client';

export class CalendarService {
  static async getEvents(filters: {
    category?: CalendarCategory;
    month?: number;
    year?: number;
  }) {
    const whereClause: Prisma.CalendarEventWhereInput = {};

    if (filters.category) {
      whereClause.category = filters.category;
    }

    if (filters.year !== undefined && filters.month !== undefined) {
      const startDate = new Date(Date.UTC(filters.year, filters.month - 1, 1));
      const endDate = new Date(Date.UTC(filters.year, filters.month, 0, 23, 59, 59, 999));
      whereClause.startTime = {
        gte: startDate,
        lte: endDate,
      };
    } else if (filters.year !== undefined) {
      const startDate = new Date(Date.UTC(filters.year, 0, 1));
      const endDate = new Date(Date.UTC(filters.year, 11, 31, 23, 59, 59, 999));
      whereClause.startTime = {
        gte: startDate,
        lte: endDate,
      };
    }

    const events = await prisma.calendarEvent.findMany({
      where: whereClause,
      orderBy: { startTime: 'asc' },
    });

    return events;
  }

  static async createEvent(data: {
    title: string;
    description?: string;
    category: CalendarCategory;
    startTime: string | Date;
    endTime: string | Date;
    location?: string;
  }) {
    const start = new Date(data.startTime);
    const end = new Date(data.endTime);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      const error: any = new Error('Formato de data de início ou fim inválido');
      error.statusCode = 400;
      error.code = 'INVALID_DATE';
      throw error;
    }

    const event = await prisma.calendarEvent.create({
      data: {
        title: data.title,
        description: data.description || null,
        category: data.category,
        startTime: start,
        endTime: end,
        location: data.location || null,
      },
    });

    return event;
  }

  static async deleteEvent(id: string) {
    const existing = await prisma.calendarEvent.findUnique({
      where: { id },
    });

    if (!existing) {
      const error: any = new Error('Evento de calendário não encontrado');
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }

    await prisma.calendarEvent.delete({
      where: { id },
    });

    return { message: 'Evento de calendário excluído com sucesso' };
  }
}
