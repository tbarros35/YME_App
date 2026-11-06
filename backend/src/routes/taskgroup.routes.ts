import { Router } from 'express';
import { TaskgroupController } from '../controllers/taskgroup.controller';
import { authenticate, requireRole } from '../middlewares/auth';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticate);

router.get('/', TaskgroupController.getAll);
router.post('/', requireRole(Role.ADMIN), TaskgroupController.create);
router.delete('/:id', requireRole(Role.ADMIN), TaskgroupController.delete);

export default router;
