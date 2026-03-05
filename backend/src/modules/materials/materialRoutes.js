import express from 'express';
import { getAllMaterials } from './materialController.js';

const router = express.Router();

router.get('/', getAllMaterials);

export default router;