import { inngest } from "../inngest/index.js";
import Attendance from "../models/Attendance.js";
import Employee from "../models/Employee.js";

// Clock in/out for employee
// POST /api/attendance
export const clockInOut = async (req, res) => {
	try {
		const session = req.session;

		const employee = await Employee.findOne({ userId: session.userId });
		if (!employee) {
			return res
				.status(404)
				.json({ success: false, error: "Employee not found." });
		}
		if (employee.isDeleted) {
			return res.status(403).json({
				success: false,
				error: "Your account is deactivated. You cannot clock in or out.",
			});
		}

		const now = new Date();
		const today = new Date(
			Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
		);

		const existing = await Attendance.findOne({
			employeeId: employee._id,
			date: today,
		});

		if (!existing) {
			const isLate =
				now.getUTCHours() > 9 ||
				(now.getUTCHours() === 9 &&
					(now.getUTCMinutes() > 0 || now.getUTCSeconds() > 0));

			const attendance = await Attendance.create({
				employeeId: employee._id,
				date: today,
				checkIn: now,
				status: isLate ? "LATE" : "PRESENT",
			});

			await inngest.send({
				name: "employee/check-out",
				data: {
					employeeId: employee._id,
					attendanceId: attendance._id,
				},
			});

			return res.status(200).json({
				success: true,
				message: "Checked in successfully.",
				data: { type: "CHECK_IN", attendance },
			});
		} else if (!existing.checkOut) {
			const checkTime = new Date(existing.checkIn).getTime();
			const diffInMins = now.getTime() - checkTime;
			const diffInHours = diffInMins / (1000 * 60 * 60);

			existing.checkOut = now;

			// * Compute working hours and Day type
			const workingHours = Math.max(
				0,
				parseFloat(diffInHours.toFixed(2)),
			);
			let dayType = "Half Day";

			if (workingHours >= 8) {
				dayType = "Full Day";
			} else if (workingHours >= 6) {
				dayType = "Three Quarter Day";
			} else if (workingHours >= 4) {
				dayType = "Half Day";
			} else {
				dayType = "Short Day";
			}

			existing.workingHours = workingHours;
			existing.dayType = dayType;

			await existing.save();

			return res.status(200).json({
				success: true,
				message: "Checked out successfully.",
				data: { type: "CHECK_OUT", attendance: existing },
			});
		}
		// Return the existing data If again checked out
		else {
			return res.json({
				success: true,
				message: "Already checked out for today.",
				data: { type: "CHECK_OUT", attendance: existing },
			});
		}
	} catch (error) {
		console.error("Attendance Error:", error);
		return res.status(500).json({
			success: false,
			error: "Attendance operation failed. Please try again.",
		});
	}
};

// Get attendance for employee
// GET /api/attendance
export const getAttendance = async (req, res) => {
	try {
		const session = req.session;

		const employee = await Employee.findOne({ userId: session.userId });
		if (!employee) {
			return res
				.status(404)
				.json({ success: false, error: "Employee not found." });
		}

		const limit = parseInt(req.query.limit || 30);

		const history = await Attendance.find({
			employeeId: employee._id,
		})
			.sort({ date: -1 })
			.limit(limit);

		return res.status(200).json({
			success: true,
			message: "Attendance records fetched successfully.",
			data: { history, employee: { isDeleted: employee.isDeleted } },
		});
	} catch (error) {
		return res.status(500).json({
			success: false,
			error: "Failed to fetch attendance records.",
		});
	}
};
