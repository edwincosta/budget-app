import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { BudgetAuthRequest } from '../middleware/budgetAuth';
import { PrismaClient } from '@prisma/client';
import * as path from 'path';
import * as fs from 'fs';
import { CSVParser } from '../utils/csvParser';
import { AdvancedCSVParser } from '../utils/advancedCsvParser';
import { PDFParser } from '../utils/pdfParser';
import { ExcelParser } from '../utils/excelParser';
import { BankParserFactory } from '../utils/parsers/BankParserFactory';
import { DuplicateDetector } from '../utils/duplicateDetector';
import Joi from 'joi';

const prisma = new PrismaClient();

export class ImportController {

    /**
     * Upload e processamento inicial do arquivo
     */
    static async uploadFile(req: AuthRequest, res: Response): Promise<void> {
        try {
            // Validação do arquivo
            if (!req.file) {
                res.status(400).json({ message: 'Nenhum arquivo enviado' });
                return;
            }

            const { accountId } = req.body;

            // Validação dos parâmetros
            const schema = Joi.object({
                accountId: Joi.string().required(),
                startDate: Joi.date().optional(),
                endDate: Joi.date().optional()
            });

            const { error, value } = schema.validate({
                accountId,
                startDate: req.body.startDate ? new Date(req.body.startDate) : undefined,
                endDate: req.body.endDate ? new Date(req.body.endDate) : undefined
            });
            if (error) {
                res.status(400).json({ message: error.details[0]?.message });
                return;
            }

            // Preparar opções de filtro por data
            const parseOptions: { dateRange?: { startDate?: Date; endDate?: Date } } = {};
            if (value.startDate || value.endDate) {
                parseOptions.dateRange = {};
                if (value.startDate) parseOptions.dateRange.startDate = value.startDate;
                if (value.endDate) parseOptions.dateRange.endDate = value.endDate;
            }

            // Busca conta e valida se pertence ao usuário
            const account = await prisma.account.findFirst({
                where: {
                    id: accountId,
                    budget: {
                        OR: [
                            { ownerId: req.user!.id },
                            {
                                shares: {
                                    some: {
                                        sharedWithId: req.user!.id,
                                        status: 'ACCEPTED',
                                        permission: 'WRITE'
                                    }
                                }
                            }
                        ]
                    }
                },
                include: {
                    budget: true
                }
            });

            if (!account) {
                res.status(404).json({ message: 'Conta não encontrada ou sem permissão de escrita' });
                return;
            }

            // Valida tipo de arquivo
            const allowedTypes = ['text/csv', 'application/pdf', 'text/plain', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
            const fileExtension = path.extname(req.file.originalname).toLowerCase();
            const allowedExtensions = ['.csv', '.pdf', '.txt', '.xls', '.xlsx'];

            if (!allowedTypes.includes(req.file.mimetype) && !allowedExtensions.includes(fileExtension)) {
                res.status(400).json({ message: 'Tipo de arquivo não suportado. Envie CSV, PDF, XLS ou XLSX.' });
                return;
            }

            // Determina tipo do arquivo
            let fileType: 'PDF' | 'CSV' | 'EXCEL';
            if (fileExtension === '.pdf' || req.file.mimetype === 'application/pdf') {
                fileType = 'PDF';
            } else if (fileExtension === '.xls' || fileExtension === '.xlsx' ||
                req.file.mimetype === 'application/vnd.ms-excel' ||
                req.file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
                fileType = 'EXCEL';
            } else {
                fileType = 'CSV';
            }

            // Cria sessão de importação
            const session = await prisma.importSession.create({
                data: {
                    filename: req.file.originalname,
                    fileType: fileType as any,
                    accountId,
                    budgetId: account.budgetId,
                    status: 'PROCESSING'
                }
            });

            try {
                // Processa arquivo baseado no tipo
                let parseResult;
                if (fileType === 'PDF') {
                    parseResult = await PDFParser.parseFile(req.file.path, parseOptions);
                } else if (fileType === 'EXCEL') {
                    parseResult = await ExcelParser.parseFile(req.file.path, parseOptions);
                } else {
                    // CSV - tenta parser específico primeiro, depois avançado, depois básico
                    let usedParser = 'unknown';
                    let bankParserSuccess = false;

                    // 1. Tenta detectar parser específico por banco
                    const bankParser = BankParserFactory.detectParser(req.file.path);
                    if (bankParser) {
                        try {
                            parseResult = await bankParser.parseFile(req.file.path, parseOptions);
                            usedParser = bankParser.bankName;
                            bankParserSuccess = true;
                            console.log(`✅ ${bankParser.bankName} parser processou ${parseResult?.transactions?.length || 0} transações`);
                            console.log('🔍 Debug bankParser result:', parseResult ? 'existe' : 'undefined');
                        } catch (bankError) {
                            console.log(`⚠️ ${bankParser.bankName} parser falhou:`, bankError.message);
                        }
                    }

                    // 2. Se parser específico falhou, tenta parser avançado
                    if (!bankParserSuccess) {
                        try {
                            parseResult = await AdvancedCSVParser.parseFile(req.file.path, parseOptions);
                            usedParser = 'AdvancedCSV';
                            console.log(`✅ Advanced CSV parser processou ${parseResult?.transactions?.length || 0} transações`);
                            console.log('🔍 Debug parseResult:', parseResult ? 'existe' : 'undefined');
                            console.log('🔍 Debug transactions:', parseResult?.transactions ? 'existe' : 'undefined');

                            // Verificação adicional para debug
                            if (!parseResult) {
                                console.error('🚨 ERRO: AdvancedCSVParser retornou undefined!');
                                throw new Error('AdvancedCSVParser retornou undefined');
                            }
                            if (!parseResult.transactions) {
                                console.error('🚨 ERRO: AdvancedCSVParser retornou sem transactions!', parseResult);
                                throw new Error('AdvancedCSVParser retornou sem transactions');
                            }
                        } catch (advancedError) {
                            console.log('⚠️ Advanced parser falhou:', advancedError.message);

                            // 3. Última tentativa com parser básico
                            parseResult = await CSVParser.parseFile(req.file.path, parseOptions);
                            usedParser = 'BasicCSV';
                            console.log(`✅ Basic CSV parser processou ${parseResult?.transactions?.length || 0} transações`);
                            console.log('🔍 Debug basicParser result:', parseResult ? 'existe' : 'undefined');
                        }
                    }

                    console.log(`📊 Parser usado: ${usedParser}`);
                }

                console.log('🔍 Final parseResult:', parseResult ? 'existe' : 'undefined');
                console.log('🔍 Final transactions:', parseResult?.transactions ? 'existe' : 'undefined');

                if (!parseResult || !parseResult.transactions) {
                    await prisma.importSession.update({
                        where: { id: session.id },
                        data: {
                            status: 'ERROR',
                            totalTransactions: 0
                        }
                    });

                    res.status(500).json({
                        message: 'Erro interno: resultado do parser é inválido',
                        errors: ['Parser retornou resultado inválido']
                    });
                    return;
                }

                if (parseResult.transactions.length === 0) {
                    await prisma.importSession.update({
                        where: { id: session.id },
                        data: {
                            status: 'ERROR',
                            totalTransactions: 0
                        }
                    });

                    res.status(400).json({
                        message: 'Nenhuma transação foi encontrada no arquivo',
                        errors: parseResult.errors
                    });
                    return;
                }

                // Verifica duplicatas
                const transactionsWithDuplicateCheck = await DuplicateDetector.processBatch(
                    parseResult.transactions.map(t => ({
                        description: t.description,
                        amount: t.amount,
                        date: t.date,
                        accountId
                    })),
                    account.budgetId
                );

                // Salva transações temporárias
                const tempTransactions = await Promise.all(
                    transactionsWithDuplicateCheck.map(async (t, index) => {
                        const originalTransaction = parseResult.transactions[index];

                        return prisma.tempTransaction.create({
                            data: {
                                sessionId: session.id,
                                description: t.description,
                                amount: t.amount,
                                type: originalTransaction.type,
                                date: t.date,
                                originalData: originalTransaction.originalData,
                                isDuplicate: t.isDuplicate,
                                duplicateReason: t.reason,
                                isClassified: false
                            }
                        });
                    })
                );

                // Atualiza sessão
                await prisma.importSession.update({
                    where: { id: session.id },
                    data: {
                        status: 'PENDING',
                        totalTransactions: tempTransactions.length,
                        processedAt: new Date()
                    }
                });

                res.status(201).json({
                    sessionId: session.id,
                    totalTransactions: tempTransactions.length,
                    duplicatesFound: tempTransactions.filter(t => t.isDuplicate).length,
                    errors: parseResult.errors
                });

            } catch (error) {
                // Marca sessão como erro
                await prisma.importSession.update({
                    where: { id: session.id },
                    data: { status: 'ERROR' }
                });

                throw error;
            }

        } catch (error) {
            console.error('Error in uploadFile:', error);
            res.status(500).json({ message: 'Erro interno do servidor' });
        } finally {
            // Remove arquivo temporário
            if (req.file?.path && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
        }
    }

    /**
     * Obtém transações da sessão para classificação
     */
    static async getSessionTransactions(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { sessionId } = req.params;

            // Busca sessão e valida permissão (READ ou superior)
            // Usuarios READ podem ver sessões, mas não classificar
            const session = await prisma.importSession.findFirst({
                where: {
                    id: sessionId,
                    budget: {
                        OR: [
                            { ownerId: req.user!.id },
                            {
                                shares: {
                                    some: {
                                        sharedWithId: req.user!.id,
                                        status: 'ACCEPTED'
                                        // Removido filtro de permission: 'WRITE' para permitir usuários READ
                                    }
                                }
                            }
                        ]
                    }
                },
                include: {
                    account: {
                        select: {
                            id: true,
                            name: true,
                            type: true
                        }
                    },
                    tempTransactions: {
                        include: {
                            category: {
                                select: {
                                    id: true,
                                    name: true,
                                    type: true,
                                    color: true
                                }
                            }
                        },
                        orderBy: {
                            date: 'desc'
                        }
                    }
                }
            });

            if (!session) {
                res.status(404).json({ message: 'Sessão de importação não encontrada' });
                return;
            }

            // Busca categorias disponíveis para classificação
            const categories = await prisma.category.findMany({
                where: {
                    budgetId: session.budgetId,
                    inactive: false
                },
                select: {
                    id: true,
                    name: true,
                    type: true,
                    color: true,
                    icon: true
                },
                orderBy: {
                    name: 'asc'
                }
            });

            res.json({
                session: {
                    id: session.id,
                    filename: session.filename,
                    fileType: session.fileType,
                    status: session.status,
                    totalTransactions: session.totalTransactions,
                    account: session.account,
                    processedAt: session.processedAt
                },
                transactions: session.tempTransactions.map(t => ({
                    ...t,
                    amount: parseFloat(t.amount.toString())
                })),
                availableCategories: categories,
                summary: {
                    total: session.tempTransactions.length,
                    classified: session.tempTransactions.filter(t => t.isClassified).length,
                    duplicates: session.tempTransactions.filter(t => t.isDuplicate).length,
                    pending: session.tempTransactions.filter(t => !t.isClassified && !t.isDuplicate).length
                }
            });

        } catch (error) {
            console.error('Error in getSessionTransactions:', error);
            res.status(500).json({ message: 'Erro interno do servidor' });
        }
    }

    /**
     * Classifica transação individual
     */
    static async classifyTransaction(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { transactionId } = req.params;
            const { categoryId } = req.body;

            // Validação
            const schema = Joi.object({
                categoryId: Joi.string().required()
            });

            const { error } = schema.validate({ categoryId });
            if (error) {
                res.status(400).json({ message: error.details[0]?.message });
                return;
            }

            // Busca transação temporária e valida permissão
            const tempTransaction = await prisma.tempTransaction.findFirst({
                where: {
                    id: transactionId,
                    session: {
                        budget: {
                            OR: [
                                { ownerId: req.user!.id },
                                {
                                    shares: {
                                        some: {
                                            sharedWithId: req.user!.id,
                                            status: 'ACCEPTED',
                                            permission: 'WRITE'
                                        }
                                    }
                                }
                            ]
                        }
                    }
                },
                include: {
                    session: true
                }
            });

            if (!tempTransaction) {
                res.status(404).json({ message: 'Transação não encontrada' });
                return;
            }

            // Valida categoria
            const category = await prisma.category.findFirst({
                where: {
                    id: categoryId,
                    budgetId: tempTransaction.session.budgetId,
                    inactive: false
                }
            });

            if (!category) {
                res.status(400).json({ message: 'Categoria inválida' });
                return;
            }

            // Atualiza transação
            const updated = await prisma.tempTransaction.update({
                where: { id: transactionId },
                data: {
                    categoryId,
                    isClassified: true
                },
                include: {
                    category: {
                        select: {
                            id: true,
                            name: true,
                            type: true,
                            color: true
                        }
                    }
                }
            });

            res.json({
                ...updated,
                amount: parseFloat(updated.amount.toString())
            });

        } catch (error) {
            console.error('Error in classifyTransaction:', error);
            res.status(500).json({ message: 'Erro interno do servidor' });
        }
    }

    /**
     * Confirma importação das transações classificadas
     */
    static async confirmImport(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { sessionId } = req.params;
            const { importDuplicates = false } = req.body;

            // Busca sessão
            const session = await prisma.importSession.findFirst({
                where: {
                    id: sessionId,
                    budget: {
                        OR: [
                            { ownerId: req.user!.id },
                            {
                                shares: {
                                    some: {
                                        sharedWithId: req.user!.id,
                                        status: 'ACCEPTED',
                                        permission: 'WRITE'
                                    }
                                }
                            }
                        ]
                    }
                },
                include: {
                    tempTransactions: {
                        where: {
                            isClassified: true,
                            ...(importDuplicates ? {} : { isDuplicate: false })
                        },
                        include: {
                            category: true
                        }
                    }
                }
            });

            if (!session) {
                res.status(404).json({ message: 'Sessão de importação não encontrada' });
                return;
            }

            if (session.tempTransactions.length === 0) {
                res.status(400).json({ message: 'Nenhuma transação classificada para importar' });
                return;
            }

            // Cria transações reais em lote
            const createdTransactions = await Promise.all(
                session.tempTransactions.map(tempTransaction =>
                    prisma.transaction.create({
                        data: {
                            description: tempTransaction.description,
                            amount: tempTransaction.amount,
                            type: tempTransaction.type,
                            date: tempTransaction.date,
                            accountId: session.accountId,
                            categoryId: tempTransaction.categoryId!,
                            budgetId: session.budgetId
                        }
                    })
                )
            );

            // Marca sessão como completa
            await prisma.importSession.update({
                where: { id: sessionId },
                data: { status: 'COMPLETED' }
            });

            res.json({
                message: 'Importação concluída com sucesso',
                importedCount: createdTransactions.length,
                transactionIds: createdTransactions.map(t => t.id)
            });

        } catch (error) {
            console.error('Error in confirmImport:', error);
            res.status(500).json({ message: 'Erro interno do servidor' });
        }
    }

    /**
     * Cancela sessão de importação
     */
    static async cancelSession(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { sessionId } = req.params;

            // Busca sessão e valida permissão
            const session = await prisma.importSession.findFirst({
                where: {
                    id: sessionId,
                    budget: {
                        OR: [
                            { ownerId: req.user!.id },
                            {
                                shares: {
                                    some: {
                                        sharedWithId: req.user!.id,
                                        status: 'ACCEPTED',
                                        permission: 'WRITE'
                                    }
                                }
                            }
                        ]
                    }
                }
            });

            if (!session) {
                res.status(404).json({ message: 'Sessão não encontrada ou sem permissão' });
                return;
            }

            // Verifica se a sessão pode ser cancelada
            if (session.status === 'COMPLETED') {
                res.status(400).json({ message: 'Sessão já foi finalizada e não pode ser cancelada' });
                return;
            }

            if (session.status === 'CANCELLED') {
                res.status(400).json({ message: 'Sessão já foi cancelada' });
                return;
            }

            // Atualiza status para CANCELLED
            await prisma.importSession.update({
                where: { id: sessionId },
                data: { status: 'CANCELLED' }
            });

            res.json({ message: 'Sessão cancelada com sucesso' });

        } catch (error) {
            console.error('Error in cancelSession:', error);
            res.status(500).json({ message: 'Erro interno do servidor' });
        }
    }

    /**
     * Lista sessões de importação do usuário
     */
    static async getSessions(req: AuthRequest, res: Response): Promise<void> {
        try {
            // Verificar se é uma requisição para orçamento específico (via BudgetAuthRequest)
            const budgetAuthReq = req as BudgetAuthRequest;
            const specificBudgetId = budgetAuthReq.budget?.id;

            let whereClause;

            if (specificBudgetId) {
                // Caso de orçamento específico (rota /api/budgets/:budgetId/import/sessions)
                whereClause = {
                    budgetId: specificBudgetId
                };
            } else {
                // Caso de orçamento próprio (rota /api/import/sessions)
                whereClause = {
                    budget: {
                        OR: [
                            { ownerId: req.user!.id },
                            {
                                shares: {
                                    some: {
                                        sharedWithId: req.user!.id,
                                        status: 'ACCEPTED'
                                    }
                                }
                            }
                        ]
                    }
                };
            }

            const sessions = await prisma.importSession.findMany({
                where: whereClause,
                include: {
                    account: {
                        select: {
                            id: true,
                            name: true,
                            type: true
                        }
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                },
                take: 50 // Últimas 50 sessões
            });

            res.json(sessions);

        } catch (error) {
            console.error('Error in getSessions:', error);
            res.status(500).json({ message: 'Erro interno do servidor' });
        }
    }
}
