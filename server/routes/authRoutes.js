import express from "express";
import {
	changePassword,
	login,
	session,
} from "../controllers/authController.js";
import { authenticateToken } from "../middleware/auth.js";

const authRoutes = express.Router();

// Routes
authRoutes.post("/login", login);
authRoutes.get("/session", authenticateToken, session);
authRoutes.post("/change-password", authenticateToken, changePassword);

export default authRoutes;
