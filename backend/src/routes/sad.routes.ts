import { Router } from 'express';
import { SadController } from '../controllers/sad.controller';
import { authenticate, requireSadPermission } from '../middlewares/auth';
import { uploadSadReport } from '../middlewares/upload';

const router = Router();

// Member access (viewing their own SAD history)
router.get('/my', authenticate, SadController.getMy);

// Authorized access (Human Resources or Admins)
router.get('/user/:userId', authenticate, requireSadPermission, SadController.getUserSAD);
router.post(
  '/',
  authenticate,
  requireSadPermission,
  uploadSadReport.single('reportPdf'),
  SadController.create
);

export default router;
