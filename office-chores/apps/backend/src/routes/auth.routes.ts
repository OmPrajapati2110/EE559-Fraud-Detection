import { Router } from 'express';
import { login, refresh, logout, me } from '../controllers/auth.controller';
import { requireAuth } from '../middleware/requireAuth';
import { loginSchema } from '@office-chores/shared';

const router = Router();

router.post('/login', (req, res, next) => {
  const result = loginSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: 'ValidationError', message: result.error.message });
    return;
  }
  login(req, res, next);
});

router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/me', requireAuth, me);

export default router;
