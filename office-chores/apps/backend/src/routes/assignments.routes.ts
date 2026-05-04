import { Router } from 'express';
import * as ctrl from '../controllers/assignments.controller';
import { requireAuth } from '../middleware/requireAuth';
import { requireAdmin } from '../middleware/requireAdmin';

const router = Router();

router.use(requireAuth);

router.get('/', ctrl.listAssignments);
router.post('/', requireAdmin, ctrl.createAssignment);
router.get('/:id', ctrl.getAssignment);
router.put('/:id', requireAdmin, ctrl.updateAssignment);
router.delete('/:id', requireAdmin, ctrl.deleteAssignment);
router.post('/:id/complete', requireAdmin, ctrl.completeAssignment);
router.post('/:id/uncomplete', requireAdmin, ctrl.uncompleteAssignment);

export default router;
