import { prisma } from '../config/prisma';
import { TimelineCategory } from '@prisma/client';

export class TimelineService {
  static async getMyTimeline(userId: string) {
    const events = await prisma.timelineEvent.findMany({
      where: { userId },
      orderBy: { eventDate: 'desc' },
    });

    return events.map((e) => ({
      id: e.id,
      userId: e.userId,
      title: e.title,
      category: e.category,
      description: e.description,
      eventDate: e.eventDate,
      createdAt: e.createdAt,
    }));
  }

  static async createTimelineEvent(data: {
    userId: string;
    title: string;
    category: TimelineCategory;
    description?: string;
    eventDate: string | Date;
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

    const event = await prisma.timelineEvent.create({
      data: {
        userId: data.userId,
        title: data.title,
        category: data.category,
        description: data.description || null,
        eventDate: new Date(data.eventDate),
      },
    });

    return {
      id: event.id,
      userId: event.userId,
      title: event.title,
      category: event.category,
      description: event.description,
      eventDate: event.eventDate,
      createdAt: event.createdAt,
    };
  }
}
