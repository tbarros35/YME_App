import { Role } from '@prisma/client';

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
        assignedDepartmentId?: string | null;
        assignedDepartmentName?: string;
        position: string;
        taskgroups: string[];
      };
    }
  }
}
