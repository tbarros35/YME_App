import { Router } from 'express';
import { WalletController } from '../controllers/wallet.controller';
import {
  authenticate,
  requireRole,
  requireWalletPermission,
  requireWalletReviewPermission,
} from '../middlewares/auth';
import {
  uploadReimbursementReceipt,
  uploadRefundProof,
} from '../middlewares/upload';
import { Role } from '@prisma/client';

const router = Router();

// Member access (viewing own wallet balance & transactions)
router.get('/balance', authenticate, WalletController.getBalance);
router.get('/summary', authenticate, WalletController.getBalance);

// Member requests for wallet balance usage
router.post('/request', authenticate, WalletController.createRequest);
router.get('/my-requests', authenticate, WalletController.getMyRequests);

// Admin & Legal & Finance review access for wallet balance requests
router.get('/requests', authenticate, requireWalletReviewPermission, WalletController.getAllRequests);
router.get('/requests/pending-count', authenticate, requireWalletReviewPermission, WalletController.getPendingCount);
router.post('/requests/:id/approve', authenticate, requireWalletReviewPermission, WalletController.approveRequest);
router.post('/requests/:id/reject', authenticate, requireWalletReviewPermission, WalletController.rejectRequest);

// Member Reimbursement Requests (Compras efetuadas para a YME - independente do saldo da carteira)
router.post(
  '/reimbursement',
  authenticate,
  uploadReimbursementReceipt.single('receipt'),
  WalletController.createReimbursement
);
router.get('/my-reimbursements', authenticate, WalletController.getMyReimbursements);

// Admin-ONLY review access for Reimbursement Requests
router.get(
  '/reimbursements',
  authenticate,
  requireRole(Role.ADMIN),
  WalletController.getAllReimbursements
);
router.get(
  '/reimbursements/pending-count',
  authenticate,
  requireRole(Role.ADMIN),
  WalletController.getPendingReimbursementsCount
);
router.post(
  '/reimbursements/:id/approve',
  authenticate,
  requireRole(Role.ADMIN),
  uploadRefundProof.single('proof'),
  WalletController.approveReimbursement
);
router.post(
  '/reimbursements/:id/reject',
  authenticate,
  requireRole(Role.ADMIN),
  WalletController.rejectReimbursement
);

// Authorized access for manual balance management (Legal & Finance Head/Manager or Admins)
router.get('/user/:userId', authenticate, requireWalletPermission, WalletController.getUserWallet);
router.post('/transaction', authenticate, requireWalletPermission, WalletController.createTransaction);

export default router;
