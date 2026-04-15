import express from "express";
import { authenticateToken } from "../middleware/auth.js";
import { clockInOut, getAttendance } from "../controllers/attendanceController.js";

const attendanceRoutes = express.Router();

attendanceRoutes.post("/", authenticateToken, clockInOut);
attendanceRoutes.get("/", authenticateToken, getAttendance);

export default attendanceRoutes