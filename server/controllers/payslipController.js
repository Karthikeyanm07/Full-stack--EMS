import Employee from "../models/Employee.js";
import Payslip from "../models/Payslip.js";
import { createPayslipSchema } from "../schemas/schema.js";

// Create Payslip
// POST /api/payslips
export const createPayslip = async (req, res) => {
	try {
		const validData = createPayslipSchema.parse(req.body);

		const netSalary =
			validData.basicSalary + validData.allowances - validData.deductions;

		const payslip = await Payslip.create({
			employeeId: validData.employeeId,
			month: validData.month,
			year: validData.year,
			allowances: validData.allowances,
			deductions: validData.deductions,
			netSalary,
		});

		return res.json({ success: true, data: payslip });
	} catch (error) {
		if (error instanceof z.ZodError) {
			return res.status(400).json({ errors: error.issues });
		}
		console.error("Payslip Creation Error:", error);
		return res.status(500).json({ error: "Failed to create payslip" });
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
			return res.json({ data });
		}
		// If it's employee
		else {
			const employee = await Employee.findOne({ userId: session.userId });
			if (!employee) {
				return res.status(404).json({ error: "Not found" });
			}

			const payslips = await Payslip.find({
				employeeId: employee._id,
			}).sort({ createdAt: -1 });

			return res.json({ data: payslips });
		}
	} catch (error) {
		return res.status(500).json({ error: "Failed to get Payslips" });
	}
};

// Get Payslip by id
// POST /api/payslips/:id

export const getPayslipById = async (req, res) => {
	try {
		const payslip = await Payslip.findById(req.params.id)
			.populate("employeeId")
			.lean();

		if (!payslip) {
			return res.status(404).json({ error: "Not found" });
		}

		const result = {
			...payslip,
			id: payslip._id.toString(),
			employee: payslip.employeeId,
		};

		return res.json(result);
	} catch (error) {
		return res.status(500).json({ error: "Failed to get Payslip" });
	}
};
