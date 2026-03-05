
import express from "express";
import {
  getTrades,
  getMaterials,
  getTools,
  getUsersByRole,
  getClients
} from "./masterController.js";

const router = express.Router();

router.get("/trades", getTrades);
router.get("/materials", getMaterials);
router.get("/tools", getTools);
router.get("/clients", getClients);
router.get("/users", getUsersByRole); 

export default router;