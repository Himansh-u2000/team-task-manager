import { Router } from 'express';
import { param } from 'express-validator';
import { getStats, getProjectStats } from '../controllers/dashboardController.js';
import protect from '../middleware/authMiddleware.js';
import validateRequest from '../middleware/validateMiddleware.js';

const router = Router();

router.use(protect);

router.get('/stats', getStats);
router.get(
  '/stats/:projectId',
  [param('projectId').isMongoId().withMessage('Valid project ID is required')],
  validateRequest,
  getProjectStats
);

export default router;
