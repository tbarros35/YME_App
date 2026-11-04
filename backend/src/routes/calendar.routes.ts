import { Router } from 'express';
import { CalendarController } from '../controllers/calendar.controller';
import { authenticate, requireRole, requireCalendarCreatePermission } from '../middlewares/auth';
import { Role } from '@prisma/client';

const router = Router();

// Member access (view events)
router.get('/', authenticate, CalendarController.getEvents);

// Event creation: Admin, HR (HR_ACTIVITY), CSR (CSR_ACTIVITY), Partnerships (OPEN_DAY)
router.post('/', authenticate, requireCalendarCreatePermission, CalendarController.create);

// Event deletion: Admin only (Executive Board)
router.delete('/:id', authenticate, requireRole(Role.ADMIN), CalendarController.delete);

export default router;
