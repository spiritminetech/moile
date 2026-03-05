import { Router } from 'express';
import { login, 
    //getUserCompanies,
    selectCompany, 
    //switchCompany 
} from './authController.js';
//import {login} from '../service/authService.js'

const router = Router();

// Login
router.post('/login', login);

// Get user companies
//router.get('/companies', getUserCompanies);

// Select company
router.post('/select-company', selectCompany);

// Switch company
//router.post('/switch-company', switchCompany);

export default router;
