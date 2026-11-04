import { Router } from 'express';
import { SupportController } from '../controllers/support.controller';
import { authenticate } from '../middlewares/auth';

const router = Router();

// All support routes require authentication
router.use(authenticate);

router.post('/tickets', SupportController.create);
router.get('/tickets/my', SupportController.getMy);
router.get('/tickets/assigned', SupportController.getAssigned);
router.get('/tickets/:id', SupportController.getById);
router.post('/tickets/:id/messages', SupportController.addMessage);
router.patch('/tickets/:id/status', SupportController.updateStatus);

export default router;
