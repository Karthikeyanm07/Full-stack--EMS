import jwt from "jsonwebtoken";

export const authenticateToken = (req, res, next) => {
	try {
		const authHeader = req.headers.authorization;
		if (!authHeader || !authHeader.startsWith("Bearer ")) {
			return res.status(401).json({
				success: false,
				error: "Authentication required. Please provide a valid token.",
			});
		}

		const token = authHeader.split(" ")[1];
		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		if (!decoded) {
			return res.status(401).json({
				success: false,
				error: "Invalid or expired token. Please log in again.",
			});
		}
		req.session = decoded;
		next();
	} catch (error) {
		return res.status(403).json({
			success: false,
			error: "Token is invalid or has expired. Please log in again.",
		});
	}
};

export const protectAdmin = (req, res, next) => {
	if (req?.session?.role !== "ADMIN") {
		return res
			.status(403)
			.json({ success: false, error: "Admin access required." });
	}
	next();
};
