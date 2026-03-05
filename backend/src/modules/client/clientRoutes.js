import express from "express";
import {
  getClients,
  createClient,
  updateClient,
  deleteClient,
} from "./clientController.js";

const router = express.Router();

router.get("/", getClients);        // GET all clients
router.post("/", createClient);     // CREATE client
router.put("/:id", updateClient);   // UPDATE client by custom id
router.delete("/:id", deleteClient); // DELETE client by custom id

export default router;
