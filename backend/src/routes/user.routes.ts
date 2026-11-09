import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticate, requireRole } from '../middlewares/auth';
import { uploadAvatar } from '../middlewares/upload';
import { Role } from '@prisma/client';

const router = Router();

// Member access
router.get('/dashboard', authenticate, UserController.getDashboardSummary);
router.get('/departments', authenticate, UserController.getDepartments);
router.post('/profile/avatar', authenticate, uploadAvatar.single('avatar'), UserController.uploadAvatar);

// Directory access (Admins, Directors, or HR members)
router.get(
  '/',
  authenticate,
  (req, res, next) => {
    if (
      req.user?.role === Role.ADMIN ||
      req.user?.role === Role.DIRECTOR ||
      req.user?.departmentName === 'Human Resources' ||
      req.user?.departmentName === 'Legal & Finance'
    ) {
      next();
      return;
    }
    res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Acesso reservado.' } });
  },
  UserController.getAll
);

router.get('/:id', authenticate, requireRole(Role.DIRECTOR, Role.ADMIN), UserController.getById);

// Admin-only Executive Board Member Management
router.post('/', authenticate, requireRole(Role.ADMIN), UserController.create);
router.put('/:id', authenticate, requireRole(Role.ADMIN), UserController.update);
router.put('/:id/password', authenticate, requireRole(Role.ADMIN), UserController.updatePassword);
router.delete('/:id', authenticate, requireRole(Role.ADMIN), UserController.delete);

export default router;
