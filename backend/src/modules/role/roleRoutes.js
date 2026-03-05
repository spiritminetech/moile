import express from "express";
import {
  getRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
} from "./roleController.js";

const router = express.Router();

router.get("/", getRoles);           // GET all roles
router.get("/:id", getRoleById);     // GET role by id
router.post("/", createRole);        // CREATE role
router.put("/:id", updateRole);      // UPDATE role by custom id
router.delete("/:id", deleteRole);   // DELETE role by custom id

export default router;
