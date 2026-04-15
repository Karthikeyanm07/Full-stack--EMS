import Employee from "../models/Employee.js";
import bcrypt from "bcrypt";
import User from "../models/User.js";
import mongoose from "mongoose";
import { z } from "zod";
import {
	createEmployeeSchema,
	updateEmployeeSchema,
} from "../schemas/schema.js";

// GET_EMPLOYESS -> /api/employees
export const getEmployees = async (req, res) => {
	try {
		const { department } = req.query;
		const where = {};

		if (department) {
			where.department = department;
		}

		const employees = await Employee.find(where)
			.sort({ createdAt: -1 })
			.populate("userId", "email role")
			.lean();

		// For frontend
		const result = employees.map((employee) => ({
			...employee,
			id: employee._id.toString(),
			user: employee.userId
				? { email: employee.userId.email, role: employee.userId.role }
				: null,
		}));

		return res.json(result);
	} catch (error) {
		return res.status(500).json({
			error: `Failed to fetch employees, ${error.message}`,
		});
	}
};

// POST_EMPLOYEE -> /api/employees
export const createEmployee = async (req, res) => {
	// Start transaction for data consistency
	const session = await mongoose.startSession();
	session.startTransaction();

	try {
		const validData = createEmployeeSchema.parse(req.body);

		// Check if email already exists
		const existingUser = await User.findOne({ email: validData.email }).session(session);
		if (existingUser) {
			await session.abortTransaction();
			return res.status(400).json({ error: "Email already exists" });
		}

		// Encrypt user password
		const hashed = await bcrypt.hash(validData.password, 10);

		// Creating User data (within transaction)
		const user = await User.create(
			[
				{
					email: validData.email,
					password: hashed,
					role: validData.role,
				},
			],
			{ session },
		);

		// From that create Employee details (within transaction)
		const employee = await Employee.create(
			[
				{
					userId: user[0]._id,
					firstName: validData.firstName,
					lastName: validData.lastName,
					email: validData.email,
					phone: validData.phone,
					position: validData.position,
					department: validData.department,
					basicSalary: validData.basicSalary,
					allowances: validData.allowances,
					deductions: validData.deductions,
					joinDate: new Date(validData.joinDate),
					bio: validData.bio,
				},
			],
			{ session },
		);

		// Commit transaction
		await session.commitTransaction();

		return res.status(201).json({ success: true, employee: employee[0] });
	} catch (error) {
		// Abort transaction on any error
		await session.abortTransaction();

		// Handle Zod validation errors
		if (error instanceof z.ZodError) {
			const formattedErrors = error.issues.map((issue) => ({
				field: issue.path.join("."),
				message: issue.message,
				code: issue.code,
			}));
			return res.status(400).json({ errors: formattedErrors });
		}

		// Handle duplicate email error
		if (error.code === 11000) {
			return res.status(400).json({ error: "Email already exists" });
		}

		console.error("Creating employee error:", error);
		return res.status(500).json({ error: "Failed to create employee" });
	} finally {
		session.endSession();
	}
};

// UPDATE_EMPLOYEE -> /api/employees/:id
export const updateEmployee = async (req, res) => {
	const session = await mongoose.startSession();
	session.startTransaction();

	//
	try {
		const { id } = req.params;
		const employeeData = updateEmployeeSchema.parse(req.body);

		const employee = await Employee.findById(id).session(session);

		if (!employee) {
			await session.abortTransaction();
			return res.status(404).json({ error: "Employee not found" });
		}

		await Employee.findByIdAndUpdate(
			id,
			{
				firstName: employeeData.firstName,
				lastName: employeeData.lastName,
				email: employeeData.email,
				phone: employeeData.phone,
				position: employeeData.position,
				department: employeeData.department,
				basicSalary: employeeData.basicSalary,
				allowances: employeeData.allowances,
				deductions: employeeData.deductions,
				employmentStatus: employeeData.employmentStatus || "ACTIVE",
				bio: employeeData.bio,
			},

			{ session, runValidators: true },
		);

		// Update user records
		const userUpdate = {};
		if (employeeData.email) {
			userUpdate.email = employeeData.email;
		}
		if (employeeData.role) {
			userUpdate.role = employeeData.role;
		}
		if (employeeData.password) {
			userUpdate.password = await bcrypt.hash(employeeData.password, 10);
		}

		if (Object.keys(userUpdate).length > 0) {
			await User.findByIdAndUpdate(employee.userId, userUpdate, {
				session,
				runValidators: true,
			});
		}

		await session.commitTransaction();

		return res.json({ success: true });
	} catch (error) {
		await session.abortTransaction();

		if (error instanceof z.ZodError) {
			const formattedErrors = error.issues.map((issue) => ({
				field: issue.path.join("."),
				message: issue.message,
				code: issue.code,
			}));
			return res.status(400).json({ errors: formattedErrors });
		}

		if (error.code === 11000) {
			return res.status(400).json({ error: "Email already exists" });
		}

		console.error("Updating employee details error:", error);
		return res
			.status(500)
			.json({ error: "Failed to update employee details" });
	} finally {
		session.endSession();
	}
};

// DELETE_EMPLOYEE -> /api/employees/:id
export const deleteEmployee = async (req, res) => {
	const session = await mongoose.startSession();
	session.startTransaction();

	try {
		const { id } = req.params;

		const employee = await Employee.findById(id).session(session);
		if (!employee) {
			await session.abortTransaction();
			return res.status(404).json({ error: "Employee not found!" });
		}

		employee.isDeleted = true;
		employee.employmentStatus = "INACTIVE";

		await employee.save({ session });

		await session.commitTransaction();
		return res.json({ success: true });
	} catch (error) {
		await session.abortTransaction();

		return res.status(500).json({ error: "Failed to delete employee" });
	}
};
