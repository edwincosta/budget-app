import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { auth } from '../middleware/auth';
import { budgetAuth, requireOwnership, BudgetAuthRequest } from '../middleware/budgetAuth';

const router = Router();
const prisma = new PrismaClient();

// Compartilhar orçamento (somente proprietário)
router.post('/:budgetId/share', auth, budgetAuth, requireOwnership, async (req: BudgetAuthRequest, res): Promise<void> => {
  try {
    const { email, permission = 'READ' } = req.body;

    if (!email) {
      res.status(400).json({ message: 'Email is required' });
      return;
    }

    // Verificar se o usuário existe
    const userToShare = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, email: true }
    });

    if (!userToShare) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Verificar se não está tentando compartilhar consigo mesmo
    if (userToShare.id === req.user!.id) {
      res.status(400).json({ message: 'Cannot share budget with yourself' });
      return;
    }

    // Verificar se já existe um compartilhamento
    const existingShare = await prisma.budgetShare.findUnique({
      where: {
        budgetId_sharedWithId: {
          budgetId: req.budget!.id,
          sharedWithId: userToShare.id
        }
      }
    });

    if (existingShare) {
      res.status(400).json({ message: 'Budget already shared with this user' });
      return;
    }

    // Criar compartilhamento
    const budgetShare = await prisma.budgetShare.create({
      data: {
        budgetId: req.budget!.id,
        sharedWithId: userToShare.id,
        permission: permission,
        status: 'PENDING'
      },
      include: {
        sharedWith: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    res.status(201).json(budgetShare);
  } catch (error) {
    console.error('Error sharing budget:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Listar compartilhamentos de um orçamento
router.get('/:budgetId/shares', auth, budgetAuth, async (req: BudgetAuthRequest, res) => {
  try {
    const shares = await prisma.budgetShare.findMany({
      where: { budgetId: req.budget!.id },
      include: {
        sharedWith: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(shares);
  } catch (error) {
    console.error('Error fetching budget shares:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Aceitar convite de compartilhamento
router.post('/invitations/:shareId/accept', auth, async (req: BudgetAuthRequest, res): Promise<void> => {
  try {
    const { shareId } = req.params;

    const share = await prisma.budgetShare.findFirst({
      where: {
        id: shareId,
        sharedWithId: req.user!.id,
        status: 'PENDING'
      },
      include: {
        budget: {
          select: { name: true, owner: { select: { name: true } } }
        }
      }
    });

    if (!share) {
      res.status(404).json({ message: 'Invitation not found' });
      return;
    }

    const updatedShare = await prisma.budgetShare.update({
      where: { id: shareId },
      data: { status: 'ACCEPTED' },
      include: {
        budget: { select: { name: true } },
        sharedWith: { select: { name: true, email: true } }
      }
    });

    res.json(updatedShare);
  } catch (error) {
    console.error('Error accepting invitation:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Rejeitar convite de compartilhamento
router.post('/invitations/:shareId/reject', auth, async (req: BudgetAuthRequest, res): Promise<void> => {
  try {
    const { shareId } = req.params;

    const share = await prisma.budgetShare.findFirst({
      where: {
        id: shareId,
        sharedWithId: req.user!.id,
        status: 'PENDING'
      }
    });

    if (!share) {
      res.status(404).json({ message: 'Invitation not found' });
      return;
    }

    await prisma.budgetShare.update({
      where: { id: shareId },
      data: { status: 'REJECTED' }
    });

    res.json({ message: 'Invitation rejected' });
  } catch (error) {
    console.error('Error rejecting invitation:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Listar convites pendentes do usuário
router.get('/invitations', auth, async (req: BudgetAuthRequest, res) => {
  try {
    const invitations = await prisma.budgetShare.findMany({
      where: {
        sharedWithId: req.user!.id,
        status: 'PENDING'
      },
      include: {
        budget: {
          select: {
            id: true,
            name: true,
            description: true,
            owner: {
              select: { name: true, email: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ data: invitations });
  } catch (error) {
    console.error('Error fetching invitations:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Remover compartilhamento (proprietário ou usuário compartilhado)
router.delete('/:budgetId/shares/:shareId', auth, budgetAuth, async (req: BudgetAuthRequest, res): Promise<void> => {
  try {
    const { shareId } = req.params;

    const share = await prisma.budgetShare.findFirst({
      where: {
        id: shareId,
        budgetId: req.budget!.id
      }
    });

    if (!share) {
      res.status(404).json({ message: 'Share not found' });
      return;
    }

    // Verificar se é proprietário ou se é o usuário que recebeu o compartilhamento
    if (req.budget!.permission !== 'OWNER' && share.sharedWithId !== req.user!.id) {
      res.status(403).json({ message: 'Permission denied' });
      return;
    }

    await prisma.budgetShare.delete({
      where: { id: shareId }
    });

    res.json({ message: 'Share removed successfully' });
  } catch (error) {
    console.error('Error removing share:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Rotas diretas de compartilhamento (sem budgetId) - compatibilidade com frontend

// Enviar convite (rota direta)
router.post('/invite', auth, async (req: BudgetAuthRequest, res): Promise<void> => {
  try {
    const { email, permissions = ['READ_ACCOUNTS'] } = req.body;

    if (!email) {
      res.status(400).json({ message: 'Email is required' });
      return;
    }

    // Buscar o usuário pelo email
    const userToShare = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, email: true }
    });

    if (!userToShare) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Verificar se não está tentando compartilhar consigo mesmo
    if (userToShare.id === req.user!.id) {
      res.status(400).json({ message: 'Cannot share with yourself' });
      return;
    }

    // Buscar o orçamento padrão do usuário atual
    const defaultBudget = await prisma.budget.findFirst({
      where: { ownerId: req.user!.id },
      orderBy: { createdAt: 'asc' }
    });

    if (!defaultBudget) {
      res.status(404).json({ message: 'No budget found for user' });
      return;
    }

    // Verificar se já existe um compartilhamento
    const existingShare = await prisma.budgetShare.findUnique({
      where: {
        budgetId_sharedWithId: {
          budgetId: defaultBudget.id,
          sharedWithId: userToShare.id
        }
      }
    });

    if (existingShare) {
      res.status(400).json({ message: 'Budget already shared with this user' });
      return;
    }

    // Criar compartilhamento
    const budgetShare = await prisma.budgetShare.create({
      data: {
        budgetId: defaultBudget.id,
        sharedWithId: userToShare.id,
        permission: 'READ',
        status: 'PENDING'
      },
      include: {
        sharedWith: {
          select: { id: true, name: true, email: true }
        },
        budget: {
          select: { id: true, name: true }
        }
      }
    });

    res.status(201).json({ data: budgetShare });
  } catch (error) {
    console.error('Error sending invite:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Listar convites enviados
router.get('/sent', auth, async (req: BudgetAuthRequest, res) => {
  try {
    const sentShares = await prisma.budgetShare.findMany({
      where: {
        budget: {
          ownerId: req.user!.id
        }
      },
      include: {
        sharedWith: {
          select: { id: true, name: true, email: true }
        },
        budget: {
          select: { id: true, name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ data: sentShares });
  } catch (error) {
    console.error('Error fetching sent invitations:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Listar compartilhamentos ativos
router.get('/active', auth, async (req: BudgetAuthRequest, res) => {
  try {
    const [sharedByMe, sharedWithMe] = await Promise.all([
      // Compartilhamentos que eu fiz
      prisma.budgetShare.findMany({
        where: {
          budget: {
            ownerId: req.user!.id
          },
          status: 'ACCEPTED'
        },
        include: {
          sharedWith: {
            select: { id: true, name: true, email: true }
          },
          budget: {
            select: { id: true, name: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      // Compartilhamentos que recebi
      prisma.budgetShare.findMany({
        where: {
          sharedWithId: req.user!.id,
          status: 'ACCEPTED'
        },
        include: {
          budget: {
            select: {
              id: true,
              name: true,
              owner: {
                select: { id: true, name: true, email: true }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      })
    ]);

    res.json({ 
      data: { 
        sharedByMe, 
        sharedWithMe 
      } 
    });
  } catch (error) {
    console.error('Error fetching active shares:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Responder a convite
router.put('/respond/:shareId', auth, async (req: BudgetAuthRequest, res): Promise<void> => {
  try {
    const { shareId } = req.params;
    const { action } = req.body;

    if (!action || !['accept', 'reject'].includes(action)) {
      res.status(400).json({ message: 'Invalid action' });
      return;
    }

    const share = await prisma.budgetShare.findFirst({
      where: {
        id: shareId,
        sharedWithId: req.user!.id,
        status: 'PENDING'
      },
      include: {
        budget: {
          select: { name: true, owner: { select: { name: true } } }
        }
      }
    });

    if (!share) {
      res.status(404).json({ message: 'Invitation not found' });
      return;
    }

    const updatedShare = await prisma.budgetShare.update({
      where: { id: shareId },
      data: { status: action === 'accept' ? 'ACCEPTED' : 'REJECTED' },
      include: {
        budget: { select: { name: true } },
        sharedWith: { select: { name: true, email: true } }
      }
    });

    res.json({ data: updatedShare });
  } catch (error) {
    console.error('Error responding to invitation:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Revogar compartilhamento (rota direta)
router.delete('/:shareId', auth, async (req: BudgetAuthRequest, res): Promise<void> => {
  try {
    const { shareId } = req.params;

    const share = await prisma.budgetShare.findFirst({
      where: {
        id: shareId,
        OR: [
          { budget: { ownerId: req.user!.id } }, // Sou o dono
          { sharedWithId: req.user!.id } // Sou o compartilhado
        ]
      }
    });

    if (!share) {
      res.status(404).json({ message: 'Share not found' });
      return;
    }

    await prisma.budgetShare.delete({
      where: { id: shareId }
    });

    res.json({ message: 'Share removed successfully' });
  } catch (error) {
    console.error('Error removing share:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
