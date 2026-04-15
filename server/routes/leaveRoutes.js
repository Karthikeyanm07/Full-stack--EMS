import express from "express";
import { createLeave, getLeaves } from "../controllers/leaveController.js";
import { authenticateToken, protectAdmin } from "../middleware/auth.js";

const leaveRoutes = express.Router();

leaveRoutes.post("/", authenticateToken, createLeave);
leaveRoutes.get("/", authenticateToken, getLeaves);
leaveRoutes.patch("/", authenticateToken, protectAdmin, getLeaves);

export default leaveRoutes