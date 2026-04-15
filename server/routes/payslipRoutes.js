import express from "express";
import { authenticateToken, protectAdmin } from "../middleware/auth.js";
import {
	createPayslip,
	getPayslipById,
	getPayslips,
} from "../controllers/payslipController.js";

const payslipRoutes = express.Router();

payslipRoutes.post("/", authenticateToken, protectAdmin, createPayslip);
payslipRoutes.get("/", authenticateToken, getPayslips);
payslipRoutes.get("/", authenticateToken, getPayslipById);

export default payslipRoutes;
