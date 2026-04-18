import Employee from "../models/Employee.js";

// get profile
// GET /api/profile
export const getProfile = async (req, res) => {
	try {
		const session = req.session;

		const employee = await Employee.findOne({ userId: session.userId });
		// Epo employee data illana avan ADMIN erupan so admin return pannanum
		if (!employee) {
			// * Authenticated user is not an employee - return Admin profile
			return res.status(200).json({
				success: true,
				message: "Profile fetched successfully.",
				data: {
					firstName: "Admin",
					lastName: "",
					email: session.email,
				},
			});
		}

		return res.status(200).json({
			success: true,
			message: "Profile fetched successfully.",
			data: employee,
		});
	} catch (error) {
		return res
			.status(500)
			.json({ success: false, error: "Failed to fetch profile." });
	}
};

// Update profile
// PUT /api/profile
export const updateProfile = async (req, res) => {
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
				error: "Your account is deactivated. You cannot update your profile.",
			});
		}

		// Because employee can only update BIO
		if (typeof req.body.bio !== "string") {
			return res
				.status(400)
				.json({ success: false, error: "Bio field is required." });
		}
		await Employee.findByIdAndUpdate(employee._id, { bio: req.body.bio });

		return res.status(200).json({
			success: true,
			message: "Profile updated successfully.",
		});
	} catch (error) {
		return res
			.status(500)
			.json({ success: false, error: "Failed to update profile." });
	}
};
