import express from 'express';

import {
  getMasterData,
  createManagerTask,
  getManagerTasks,
  getManagerTaskById,
  updateManagerTask,
  deleteManagerTask
} from './managerTaskController.js';

const router = express.Router();

// Master data for dropdowns
router.get('/master-data', getMasterData);

// CRUD operations
router.post('/', createManagerTask);
router.get('/', getManagerTasks);
router.get('/:id', getManagerTaskById);
router.put('/:id', updateManagerTask);
router.delete('/:id', deleteManagerTask);

export default router;
