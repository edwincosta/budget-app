import { Router, Response } from 'express';
import { auth, AuthRequest } from '../middleware/auth';

const router = Router();

// Test route
router.get('/test', auth, async (req: AuthRequest, res: Response) => {
  res.json({ message: 'Reports API working' });
});

export default router;
