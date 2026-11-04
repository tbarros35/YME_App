import { Role, Taskgroup } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        fullName: string;
        role: Role;
        departmentId: string;
        departmentName?: string;
        position: string;
        taskgroups: Taskgroup[];
      };
    }
  }
}
