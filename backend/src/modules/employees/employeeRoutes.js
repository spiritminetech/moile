// routes/employeeRoutes.js
import express from 'express';
import {
  createEmployeeWithFiles,
  updateEmployeeWithFiles,
  deleteEmployeeWithFiles,
  getEmployeesWithFiles,
    getWorkerEmployees,
  getEmployeeByIdWithFiles,
  getEmployeesByCompany
} from './employeeController.js';

import { uploadEmployeeFiles } from '../../middleware/upload.js';

const router = express.Router();

// CREATE employee with files
router.post('/', uploadEmployeeFiles, createEmployeeWithFiles);

router.get('/company/:companyId/workers', getWorkerEmployees);
router.get('/company/:companyId', getEmployeesByCompany);

router.get('/:id', getEmployeeByIdWithFiles);




// GET all employees
router.get('/', getEmployeesWithFiles);




// UPDATE employee with files
router.put('/:id', uploadEmployeeFiles, updateEmployeeWithFiles);

// DELETE employee
router.delete('/:id', deleteEmployeeWithFiles);

export default router;
