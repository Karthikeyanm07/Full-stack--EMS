import express from "express";
import {
	getEmployees,
	createEmployee,
	updateEmployee,
	deleteEmployee,
} from "../controllers/employeeController.js";
import { authenticateToken, protectAdmin } from "../middleware/auth.js";

const employeeRoutes = express.Router();

// Routes
employeeRoutes.get("/", authenticateToken, protectAdmin, getEmployees); // GET all employees
employeeRoutes.post("/", authenticateToken, protectAdmin, createEmployee); // CREATE new employee
employeeRoutes.put("/:id", authenticateToken, protectAdmin, updateEmployee); // UPDATE employee
employeeRoutes.delete("/:id", authenticateToken, protectAdmin, deleteEmployee); // DELETE employee

export default employeeRoutes;
