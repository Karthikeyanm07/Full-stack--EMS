import jwt from "jsonwebtoken";

export const authenticateToken = (req, res, next) => {
	try {
		const authHeader = req.headers.authorization;
		if (!authHeader || !authHeader.startsWith("Bearer ")) {
			return res.status(401).json({ error: "Unauthorized" });
		}

		const token = authHeader.split(" ")[1];
		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		if (!decoded) {
			return res.status(401).json({ error: "Unauthorized" });
		}
		req.session = decoded;
		next();
	} catch (error) {
		return res.status(403).json({ error: "Invalid token" });
	}
};

export const protectAdmin = (req, res, next) => {
	if (req?.session?.role !== "ADMIN") {
		return res.status(403).json({ error: "Admin access required" });
	}
    next();
};
