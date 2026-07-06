import { Router } from 'express';
import { body, param } from 'express-validator';
import {
  createProject,
  getProjects,
  getProject,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
} from '../controllers/projectController.js';
import protect from '../middleware/authMiddleware.js';
import validateRequest from '../middleware/validateMiddleware.js';

const router = Router();

// All routes require authentication
router.use(protect);

router.get('/', getProjects);
router.post(
  '/',
  [
    body('title').trim().notEmpty().withMessage('Project title is required'),
    body('description').optional().trim(),
  ],
  validateRequest,
  createProject
);
router.get(
  '/:id',
  [param('id').isMongoId().withMessage('Valid project ID is required')],
  validateRequest,
  getProject
);
router.put(
  '/:id',
  [
    param('id').isMongoId().withMessage('Valid project ID is required'),
    body('title').optional().trim().notEmpty(),
    body('description').optional().trim(),
  ],
  validateRequest,
  updateProject
);
router.delete(
  '/:id',
  [param('id').isMongoId().withMessage('Valid project ID is required')],
  validateRequest,
  deleteProject
);
router.post(
  '/:id/members',
  [
    param('id').isMongoId().withMessage('Valid project ID is required'),
    body('userId').isMongoId().withMessage('Valid user ID is required'),
  ],
  validateRequest,
  addMember
);
router.delete(
  '/:id/members/:userId',
  [
    param('id').isMongoId().withMessage('Valid project ID is required'),
    param('userId').isMongoId().withMessage('Valid user ID is required'),
  ],
  validateRequest,
  removeMember
);

export default router;
