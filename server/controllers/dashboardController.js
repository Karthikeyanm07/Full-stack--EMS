import { DEPARTMENTS } from "../constants/departments.js";
import Attendance from "../models/Attendance.js";
import Employee from "../models/Employee.js";
import LeaveApplication from "../models/LeaveApplication.js";
import Payslip from "../models/Payslip.js";

// Get dashboard for Employee and Admin
// GET /api/dashboard
export const getDashboard = async (req, res) => {
	try {
		const session = req.session;

		if (session.role === "ADMIN") {
			const [totalEmployees, todayAttendance, pendingLeaves] =
				await Promise.all([
					Employee.countDocuments({ isDeleted: { $ne: true } }),
					Attendance.countDocuments({
						date: {
							$gte: new Date(new Date().setHours(0, 0, 0, 0)),
							$lt: new Date(new Date().setHours(23, 59, 59, 999)),
						},
					}),
					LeaveApplication.countDocuments({ status: "PENDING" }),
				]);
			//
			return res.status(200).json({
				success: true,
				message: "Dashboard details fetched successfully, for Admin",
				data: {
					role: "ADMIN",
					totalEmployees,
					totalDepartments: DEPARTMENTS.length,
					todayAttendance,
					pendingLeaves,
				},
			});
		} else {
			const employee = await Employee.findOne({
				userId: session.userId,
			}).lean();

			if (!employee) {
				return res.status(404).json({
					success: false,
					error: "Employee not found",
				});
			}

			const today = new Date();
			const [currentMonthAttendance, pendingLeaves, latestPayslip] =
				await Promise.all([
					Attendance.countDocuments({
						employeeId: employee._id,
						date: {
							$gte: new Date(
								today.getFullYear(),
								today.getMonth(),
								1,
							),
							$lt: new Date(
								today.getFullYear(),
								today.getMonth() + 1,
								1,
							),
						},
					}),
					LeaveApplication.countDocuments({
						employeeId: employee._id,
						status: "PENDING",
					}),
					Payslip.findOne({
						employeeId: employee._id,
					})
						.sort({ createdAt: -1 })
						.lean(),
				]);

			return res.status(200).json({
				success: true,
				message: "Dashboard details fetched successfully, for Employee",
				data: {
					role: "EMPLOYEE",
					employee: {
						...employee,
						id: employee._id.toString(),
					},
					currentMonthAttendance,
					pendingLeaves,
					latestPayslip: latestPayslip
						? {
								...latestPayslip,
								id: latestPayslip._id.toString(),
							}
						: null,
				},
			});
		}
	} catch (error) {
		console.error("Dashboard error:", error);
		return res.status(500).json({
			success: false,
			error: "Cannot get dashboard details",
		});
	}
};
