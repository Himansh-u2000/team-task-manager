import { Router } from 'express';
import { body, param, query } from 'express-validator';
import {
  createTask,
  getProjectTasks,
  getMyTasks,
  updateTask,
  updateTaskStatus,
  deleteTask,
} from '../controllers/taskController.js';
import protect from '../middleware/authMiddleware.js';
import validateRequest from '../middleware/validateMiddleware.js';

const router = Router();

// All routes require authentication
router.use(protect);

router.get(
  '/my-tasks',
  [
    query('status').optional().isIn(['todo', 'in_progress', 'done']),
    query('priority').optional().isIn(['low', 'medium', 'high']),
  ],
  validateRequest,
  getMyTasks
);
router.get(
  '/project/:projectId',
  [param('projectId').isMongoId().withMessage('Valid project ID is required')],
  validateRequest,
  getProjectTasks
);
router.post(
  '/',
  [
    body('title').trim().notEmpty().withMessage('Task title is required'),
    body('project').isMongoId().withMessage('Valid project ID is required'),
    body('assignedTo').isMongoId().withMessage('Valid assignee ID is required'),
    body('priority').optional().isIn(['low', 'medium', 'high']),
    body('dueDate').optional().isISO8601().withMessage('Invalid date format'),
  ],
  validateRequest,
  createTask
);
router.put(
  '/:id/status',
  [
    param('id').isMongoId().withMessage('Valid task ID is required'),
    body('status').isIn(['todo', 'in_progress', 'done']).withMessage('Invalid status'),
  ],
  validateRequest,
  updateTaskStatus
);
router.put(
  '/:id',
  [
    param('id').isMongoId().withMessage('Valid task ID is required'),
    body('title').optional().trim().notEmpty(),
    body('assignedTo').optional().isMongoId(),
    body('priority').optional().isIn(['low', 'medium', 'high']),
    body('status').optional().isIn(['todo', 'in_progress', 'done']),
    body('dueDate').optional({ values: 'falsy' }).isISO8601().withMessage('Invalid date format'),
  ],
  validateRequest,
  updateTask
);
router.delete(
  '/:id',
  [param('id').isMongoId().withMessage('Valid task ID is required')],
  validateRequest,
  deleteTask
);

export default router;
