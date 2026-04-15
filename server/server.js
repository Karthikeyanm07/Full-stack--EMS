import express from "express";
import cors from "cors";
import "dotenv/config";
import multer from "multer";
import connectDB from "./config/db.js";
import employeeRoutes from "./routes/employeeRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(multer().none());

// Routes
app.get("/", (req, res) => res.send("Server is running..."));
app.use("/api/auth", authRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/attendance", attendanceRoutes);

await connectDB();

app.listen(PORT, () => {
	console.log(`Server is running on port: ${PORT}`);
});
