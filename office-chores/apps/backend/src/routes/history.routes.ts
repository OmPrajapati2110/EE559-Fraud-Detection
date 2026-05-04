import { Router } from 'express';
import * as ctrl from '../controllers/history.controller';
import { requireAuth } from '../middleware/requireAuth';

const router = Router();

router.use(requireAuth);

router.get('/', ctrl.listHistory);
router.get('/:id', ctrl.getHistoryEntry);

export default router;
