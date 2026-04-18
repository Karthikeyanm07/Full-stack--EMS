import express from "express";
import { authenticateToken } from "../middleware/auth.js";
import { getProfile, updateProfile } from "../controllers/profileController.js";

const profileRoutes = express.Router();

profileRoutes.get("/", authenticateToken, getProfile);
profileRoutes.put("/", authenticateToken, updateProfile);

export default profileRoutes;
