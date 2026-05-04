import { Router } from 'express';
import * as ctrl from '../controllers/chores.controller';
import { requireAuth } from '../middleware/requireAuth';
import { requireAdmin } from '../middleware/requireAdmin';

const router = Router();

router.use(requireAuth);

router.get('/', ctrl.listChores);
router.post('/', requireAdmin, ctrl.createChore);
router.get('/:id', ctrl.getChore);
router.put('/:id', requireAdmin, ctrl.updateChore);
router.delete('/:id', requireAdmin, ctrl.deleteChore);
router.get('/:id/assignments', ctrl.getChoreAssignmentsHandler);
router.post('/:id/preview', ctrl.previewRecurrence);

export default router;
