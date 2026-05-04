import { Router } from 'express';
import * as ctrl from '../controllers/users.controller';
import { requireAuth } from '../middleware/requireAuth';
import { requireAdmin } from '../middleware/requireAdmin';

const router = Router();

router.use(requireAuth);

router.get('/', requireAdmin, ctrl.listUsers);
router.post('/invite', requireAdmin, ctrl.inviteUser);
router.get('/:id', ctrl.getUser);
router.put('/:id', ctrl.updateUser);
router.put('/:id/role', requireAdmin, ctrl.updateUserRole);
router.delete('/:id', requireAdmin, ctrl.deactivateUser);

export default router;
