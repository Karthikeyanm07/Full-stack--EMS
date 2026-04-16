import Employee from "../models/Employee.js";
import LeaveApplication from "../models/LeaveApplication.js";
// Create Leave
// POST /api/leaves
export const createLeave = async (req, res) => {
	try {
		const session = req.session;

		const employee = await Employee.findOne({
			userId: session.userId,
		});
		if (!employee) {
			return res
				.status(404)
				.json({ success: false, error: "Employee not found." });
		}
		if (employee.isDeleted) {
			return res.status(403).json({
				success: false,
				error: "Your account is deactivated. You cannot apply for leave.",
			});
		}

		const { type, startDate, endDate, reason } = req.body;
		if (!type || !startDate || !endDate || !reason) {
			return res.status(400).json({
				success: false,
				error: "All fields are required: type, start date, end date, and reason.",
			});
		}

		const today = new Date();
		today.setHours(0, 0, 0, 0);

		const start = new Date(startDate);
		const end = new Date(endDate);
		if (start < today || end < today) {
			return res.status(400).json({
				success: false,
				error: "Leave dates must be in the future.",
			});
		}
		if (new Date(endDate) < new Date(startDate)) {
			return res.status(400).json({
				success: false,
				error: "End date cannot be before start date.",
			});
		}

		const leave = await LeaveApplication.create({
			employeeId: employee._id,
			type,
			startDate: new Date(startDate),
			endDate: new Date(endDate),
			reason,
			status: "PENDING",
		});

		return res.status(200).json({
			success: true,
			message: "Leave application submitted successfully.",
			data: leave,
		});
	} catch (error) {
		return res.status(500).json({
			success: false,
			error: "Failed to submit leave application.",
		});
	}
};

// Get Leaves
// GET /api/leaves
export const getLeaves = async (req, res) => {
	try {
		const session = req.session;

		const isAdmin = session.role === "ADMIN";
		if (isAdmin) {
			const status = req.query.status;
			const where = status ? { status } : {};
			const leaves = await LeaveApplication.find(where)
				.populate("employeeId") // * Join with Employee collection
				.sort({ createdAt: -1 });

			const data = leaves.map((leave) => {
				const obj = leave.toObject(); // * Convert Mongoose doc to plain object
				return {
					...obj,
					id: obj._id.toString(),
					employee: obj.employeeId,
					employeeId: obj.employeeId?._id.toString(),
				};
			});

			return res.status(200).json({
				success: true,
				message: "Leave applications fetched successfully.",
				data,
			});
		}
		// If it's Find all leaves for this employee
		else {
			const employee = await Employee.findOne({
				userId: session.userId,
			}).lean();
			if (!employee) {
				return res
					.status(404)
					.json({ success: false, error: "Employee not found." });
			}

			const leaves = await LeaveApplication.find({
				employeeId: employee._id,
			}).sort({ createdAt: -1 });

			return res.status(200).json({
				success: true,
				message: "Leave applications fetched successfully.",
				data: {
					leaves,
					employee: { ...employee, id: employee._id.toString() },
				},
			});
		}
	} catch (error) {
		return res.status(500).json({
			success: false,
			error: "Failed to fetch leave applications.",
		});
	}
};

// Update Leave STATUS
// PUT /api/leaves/:id
export const updateLeaveStatus = async (req, res) => {
	try {
		if (req.session.role !== "ADMIN") {
			return res.status(403).json({
				success: false,
				error: "Only admins can update leave status.",
			});
		}
		const { status } = req.body;

		if (!["APPROVED", "REJECTED", "PENDING"].includes(status)) {
			return res.status(400).json({
				success: false,
				error: "Invalid status. Must be APPROVED, REJECTED, or PENDING.",
			});
		}

		const leave = await LeaveApplication.findByIdAndUpdate(
			req.params.id,
			{ status },
			{ returnDocument: "after" },
		);

		if (!leave) {
			return res.status(404).json({
				success: false,
				error: "Leave application not found.",
			});
		}
		return res.status(200).json({
			success: true,
			message: "Leave status updated successfully.",
			data: leave,
		});
	} catch (error) {
		return res
			.status(500)
			.json({ success: false, error: "Failed to update leave status." });
	}
};
