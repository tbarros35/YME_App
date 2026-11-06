import { Router } from 'express';
import { TimelineController } from '../controllers/timeline.controller';
import { authenticate, requireRole } from '../middlewares/auth';
import { Role } from '@prisma/client';

const router = Router();

// Member access (both / and /my return member's timeline)
router.get('/', authenticate, TimelineController.getMy);
router.get('/my', authenticate, TimelineController.getMy);

// Admin access only (Executive Board manages timeline milestones)
router.get('/user/:userId', authenticate, requireRole(Role.ADMIN), TimelineController.getUserTimeline);
router.post('/', authenticate, requireRole(Role.ADMIN), TimelineController.create);

export default router;
