import { Router } from 'express';
import authRoutes from './auth.routes';
import sadRoutes from './sad.routes';
import walletRoutes from './wallet.routes';
import timelineRoutes from './timeline.routes';
import calendarRoutes from './calendar.routes';
import userRoutes from './user.routes';
import supportRoutes from './support.routes';
import taskgroupRoutes from './taskgroup.routes';
import { UserController } from '../controllers/user.controller';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.get('/dashboard/summary', authenticate, UserController.getDashboardSummary);
router.use('/auth', authRoutes);
router.use('/sad', sadRoutes);
router.use('/wallet', walletRoutes);
router.use('/timeline', timelineRoutes);
router.use('/calendar', calendarRoutes);
router.use('/users', userRoutes);
router.use('/support', supportRoutes);
router.use('/taskgroups', taskgroupRoutes);

export default router;
