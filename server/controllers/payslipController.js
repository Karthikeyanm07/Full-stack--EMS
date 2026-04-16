import Employee from "../models/Employee.js";
import Payslip from "../models/Payslip.js";
import { createPayslipSchema } from "../schemas/schema.js";
import { z } from "zod";

// Create Payslip
// POST /api/payslips
export const createPayslip = async (req, res) => {
	try {
		const validData = createPayslipSchema.parse(req.body);

		const employee = await Employee.findById(validData.employeeId);
		if (!employee) {
			return res
				.status(404)
				.json({ success: false, error: "Employee not found." });
		}
		if (employee.isDeleted) {
			return res.status(400).json({
				success: false,
				error: "Cannot create payslip for a deactivated employee.",
			});
		}

		const netSalary =
			validData.basicSalary + validData.allowances - validData.deductions;

		if (netSalary < 0) {
			return res
				.status(400)
				.json({
					success: false,
					error: "Deductions cannot exceed total salary.",
				});
		}

		const payslip = await Payslip.create({
			employeeId: validData.employeeId,
			month: validData.month,
			year: validData.year,
			basicSalary: validData.basicSalary,
			allowances: validData.allowances,
			deductions: validData.deductions,
			netSalary,
		});

		return res.status(200).json({
			success: true,
			message: "Payslip created successfully.",
			data: payslip,
		});
	} catch (error) {
		if (error instanceof z.ZodError) {
			return res
				.status(400)
				.json({ success: false, errors: error.issues });
		}
		console.error("Payslip Creation Error:", error);
		return res
			.status(500)
			.json({ success: false, error: "Failed to create payslip." });
	}
};

// Get Payslips
// GET /api/payslips

export const getPayslips = async (req, res) => {
	try {
		const session = req.session;

		const isAdmin = session.role === "ADMIN";
		if (isAdmin) {
			const payslips = await Payslip.find()
				.populate("employeeId")
				.sort({ createdAt: -1 });

			const data = payslips.map((payslip) => {
				const obj = payslip.toObject();
				return {
					...obj,
					id: obj._id.toString(),
					employee: obj.employeeId,
					employeeId: obj.employeeId?._id?.toString(),
				};
			});
			return res.status(200).json({
				success: true,
				message: "Payslips fetched successfully.",
				data,
			});
		}
		// If it's employee
		else {
			const employee = await Employee.findOne({ userId: session.userId });
			if (!employee) {
				return res
					.status(404)
					.json({ success: false, error: "Employee not found." });
			}

			const payslips = await Payslip.find({
				employeeId: employee._id,
			}).sort({ createdAt: -1 });

			return res.status(200).json({
				success: true,
				message: "Payslips fetched successfully.",
				data: payslips,
			});
		}
	} catch (error) {
		return res
			.status(500)
			.json({ success: false, error: "Failed to fetch payslips." });
	}
};

// Get Payslip by id
// GET /api/payslips/:id
export const getPayslipById = async (req, res) => {
	try {
		const payslip = await Payslip.findById(req.params.id)
			.populate("employeeId")
			.lean();

		if (!payslip) {
			return res
				.status(404)
				.json({ success: false, error: "Payslip not found." });
		}

		const result = {
			...payslip,
			id: payslip._id.toString(),
			employee: payslip.employeeId,
		};

		return res.status(200).json({
			success: true,
			message: "Payslip fetched successfully.",
			data: result,
		});
	} catch (error) {
		return res
			.status(500)
			.json({ success: false, error: "Failed to fetch payslip." });
	}
};
