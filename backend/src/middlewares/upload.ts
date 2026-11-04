import multer from 'multer';
import path from 'path';
import fs from 'fs';

const sadUploadsDir = path.resolve(__dirname, '../../uploads/sad');
const receiptsUploadsDir = path.resolve(__dirname, '../../uploads/receipts');
const proofsUploadsDir = path.resolve(__dirname, '../../uploads/proofs');

// Ensure upload directories exist
[sadUploadsDir, receiptsUploadsDir, proofsUploadsDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Storage for SAD reports
const sadStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    if (!fs.existsSync(sadUploadsDir)) {
      fs.mkdirSync(sadUploadsDir, { recursive: true });
    }
    cb(null, sadUploadsDir);
  },
  filename: (_req, file, cb) => {
    const cleanOriginalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    const ext = path.extname(cleanOriginalName) || '.pdf';
    const baseName = path.basename(cleanOriginalName, ext);
    cb(null, `sad_${baseName}_${uniqueSuffix}${ext}`);
  },
});

const sadFileFilter = (
  _req: any,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf')) {
    cb(null, true);
  } else {
    const err: any = new Error('Formato de ficheiro inválido. O relatório de SAD deve ser um documento PDF (.pdf).');
    err.statusCode = 400;
    err.code = 'INVALID_FILE_TYPE';
    cb(err);
  }
};

export const uploadSadReport = multer({
  storage: sadStorage,
  fileFilter: sadFileFilter,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25 MB max
  },
});

// File filter for receipts & proof (PDF or Images)
const docOrImageFilter = (
  _req: any,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedMimeTypes = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
  ];
  const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.webp'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedMimeTypes.includes(file.mimetype) || allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    const err: any = new Error(
      'Formato de ficheiro inválido. O comprovativo deve ser uma imagem (.png, .jpg, .jpeg, .webp) ou documento PDF (.pdf).'
    );
    err.statusCode = 400;
    err.code = 'INVALID_FILE_TYPE';
    cb(err);
  }
};

// Storage for Reimbursement Receipts (Invoices)
const receiptStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    if (!fs.existsSync(receiptsUploadsDir)) {
      fs.mkdirSync(receiptsUploadsDir, { recursive: true });
    }
    cb(null, receiptsUploadsDir);
  },
  filename: (_req, file, cb) => {
    const cleanOriginalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    const ext = path.extname(cleanOriginalName) || '.pdf';
    const baseName = path.basename(cleanOriginalName, ext);
    cb(null, `fatura_${baseName}_${uniqueSuffix}${ext}`);
  },
});

export const uploadReimbursementReceipt = multer({
  storage: receiptStorage,
  fileFilter: docOrImageFilter,
  limits: {
    fileSize: 25 * 1024 * 1024,
  },
});

// Storage for Refund Proofs (Uploaded by Admin upon approval)
const proofStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    if (!fs.existsSync(proofsUploadsDir)) {
      fs.mkdirSync(proofsUploadsDir, { recursive: true });
    }
    cb(null, proofsUploadsDir);
  },
  filename: (_req, file, cb) => {
    const cleanOriginalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    const ext = path.extname(cleanOriginalName) || '.pdf';
    const baseName = path.basename(cleanOriginalName, ext);
    cb(null, `devolucao_${baseName}_${uniqueSuffix}${ext}`);
  },
});

export const uploadRefundProof = multer({
  storage: proofStorage,
  fileFilter: docOrImageFilter,
  limits: {
    fileSize: 25 * 1024 * 1024,
  },
});
