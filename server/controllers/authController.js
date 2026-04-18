import User from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// * Login for Employee and Admin
// POST /api/auth/login
export const login = async (req, res) => {
	try {
		const { email, password, role_type } = req.body;
		if (!email || !password) {
			return res.status(400).json({
				success: false,
				error: "Email and password are required.",
			});
		}

		const user = await User.findOne({ email }).select("+password");
		if (!user) {
			return res
				.status(401)
				.json({ success: false, error: "Invalid credentials." });
		}

		const isValid = await bcrypt.compare(password, user.password);
		if (!isValid) {
			return res
				.status(401)
				.json({ success: false, error: "Invalid credentials." });
		}

		if (role_type === "admin" && user.role !== "ADMIN") {
			return res
				.status(401)
				.json({ success: false, error: "Not authorized as admin." });
		}
		if (role_type === "employee" && user.role !== "EMPLOYEE") {
			return res
				.status(401)
				.json({ success: false, error: "Not authorized as employee." });
		}

		// If find logged in user
		const payload = {
			userId: user._id.toString(),
			role: user.role,
			email: user.email,
		};

		// Token for auth
		const token = jwt.sign(payload, process.env.JWT_SECRET, {
			expiresIn: "7d",
		});

		return res.status(200).json({
			success: true,
			message: "Login successful.",
			data: { user: payload, token },
		});
	} catch (error) {
		console.error("Login error:", error);
		return res
			.status(500)
			.json({ success: false, error: "Login failed. Please try again." });
	}
};

// get Session for employee and admin
// GET /api/auth/session
export const session = (req, res) => {
	const session = req.session;
	return res.status(200).json({
		success: true,
		message: "Session retrieved successfully.",
		user: session,
	});
};

// Change password functionality for Employee and Admin
// POST /api/auth/change-password
export const changePassword = async (req, res) => {
	try {
		const session = req.session;

		const { currentPassword, newPassword } = req.body;
		if (!currentPassword || !newPassword) {
			return res.status(400).json({
				success: false,
				error: "Current password and new password are required.",
			});
		}

		if (newPassword.length < 8) {
			return res.status(400).json({
				success: false,
				error: "New password must be at least 8 characters.",
			});
		}

		const user = await User.findById(session.userId).select("+password");
		if (!user) {
			return res
				.status(404)
				.json({ success: false, error: "User not found." });
		}

		const isValid = await bcrypt.compare(currentPassword, user.password);
		if (!isValid) {
			return res.status(400).json({
				success: false,
				error: "Current password is incorrect.",
			});
		}

		const hashed = await bcrypt.hash(newPassword, 10);

		await User.findByIdAndUpdate(session.userId, { password: hashed });

		return res.status(200).json({
			success: true,
			message: "Password changed successfully.",
		});
	} catch (error) {
		console.error("Change password error:", error);
		return res.status(500).json({
			success: false,
			error: "Failed to change password. Please try again.",
		});
	}
};
