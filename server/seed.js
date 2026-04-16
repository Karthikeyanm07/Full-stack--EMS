import "dotenv/config";
import connectDB from "./config/db.js";
import User from "./models/User.js";
import bcrypt from "bcrypt";
import mongoose from "mongoose";

const adminPassword = process.env.ADMIN_PASSWORD;

async function registerAdmin() {
	try {
		const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();

		if (!adminEmail || !adminPassword) {
			console.error(
				"Missing ADMIN_EMAIL or ADMIN_PASSWORD in env variable",
			);
			process.exit(1);
		}

		await connectDB();

		const existingAdmin = await User.findOne({
			email: adminEmail,
		});

		if (existingAdmin) {
			console.log("User already exist as role", existingAdmin.role);
			await mongoose.connection.close();
			process.exit(0);
		}

		const hashed = await bcrypt.hash(adminPassword, 10);

		const admin = await User.create({
			email: adminEmail,
			password: hashed,
			role: "ADMIN",
		});

		console.log("Admin user created");
		console.log("\nemail:", admin.email);
		console.log("\nReminder: Change the password after your first login.");

		await mongoose.connection.close(); // Clean shutdown
		process.exit(0);
	} catch (error) {
		console.error("Seed failed", error);
		if (mongoose.connection.readyState !== 0) {
			await mongoose.connection.close();
		}
		process.exit(1);
	}
}

registerAdmin();
