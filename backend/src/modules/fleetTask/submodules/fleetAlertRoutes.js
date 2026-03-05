import express from 'express';
import {
  createFleetAlert
} from '../../controllers/fleetTask/fleetAlertController.js';

const router = express.Router();

router.post('/', createFleetAlert);

export default router;