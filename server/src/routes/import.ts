import { Router } from 'express';
import multer from 'multer';
import * as path from 'path';
import * as os from 'os';
import { auth } from '../middleware/auth';
import { budgetAuth, requireWritePermission } from '../middleware/budgetAuth';
import { ImportController } from '../controllers/importController';

const router = Router();

// Configuração do multer para upload de arquivos
const upload = multer({
    dest: path.join(os.tmpdir(), 'budget-imports'), // Diretório temporário
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB max
    },
    fileFilter: (req, file, cb) => {
        // Permite CSV, PDF e Excel
        const allowedTypes = [
            'text/csv',
            'application/pdf',
            'text/plain',
            'application/vnd.ms-excel', // .xls
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' // .xlsx
        ];
        const allowedExtensions = ['.csv', '.pdf', '.txt', '.xls', '.xlsx'];

        const fileExtension = path.extname(file.originalname).toLowerCase();

        if (allowedTypes.includes(file.mimetype) || allowedExtensions.includes(fileExtension)) {
            cb(null, true);
        } else {
            cb(new Error('Tipo de arquivo não suportado. Envie apenas CSV, Excel (XLS/XLSX) ou PDF.'));
        }
    }
});

// Middleware de autenticação para todas as rotas
router.use(auth);

// Rotas de importação
/**
 * POST /api/import/upload
 * Upload e processamento inicial do arquivo
 * Body: multipart/form-data com arquivo + accountId
 */
router.post('/upload', upload.single('file'), ImportController.uploadFile);

/**
 * GET /api/import/sessions
 * Lista sessões de importação do usuário
 */
router.get('/sessions', ImportController.getSessions);

/**
 * GET /api/import/sessions/:sessionId
 * Obtém transações de uma sessão para classificação
 */
router.get('/sessions/:sessionId', ImportController.getSessionTransactions);

/**
 * PUT /api/import/transactions/:transactionId/classify
 * Classifica uma transação individual
 * Body: { categoryId: string }
 */
router.put('/transactions/:transactionId/classify', ImportController.classifyTransaction);

/**
 * POST /api/import/sessions/:sessionId/confirm
 * Confirma importação das transações classificadas
 * Body: { importDuplicates?: boolean }
 */
router.post('/sessions/:sessionId/confirm', ImportController.confirmImport);

/**
 * DELETE /api/import/sessions/:sessionId
 * Cancela sessão de importação
 */
router.delete('/sessions/:sessionId', ImportController.cancelSession);



export default router;
