import { z } from "zod";
import { DEPARTMENTS } from "../constants/departments.js";

export const createEmployeeSchema = z.object({
	firstName: z
		.string()
		.min(2, "First name must be at least 2 characters")
		.max(50, "First name cannot exceed 50 characters"),
	lastName: z
		.string()
		.min(2, "Last name must be at least 2 characters")
		.max(50, "Last name cannot exceed 50 characters"),
	email: z
		.string()
		.toLowerCase()
		.pipe(z.email({ error: "Invalid email address" })),
	password: z
		.string()
		.min(8, "Password must be at least 8 characters")
		.max(128, "Password cannot exceed 128 characters"),
	phone: z.string().regex(/^[0-9\-\+\(\)]{10,}$/, "Invalid phone number"),
	position: z.string().min(2, "Position must be at least 2 characters"),
	department: z.enum(DEPARTMENTS).default("Engineering"),
	basicSalary: z.number().positive("Salary must be greater than 0"),
	allowances: z.number().min(0, "Allowances cannot be negative").default(0),
	deductions: z.number().min(0, "Deductions cannot be negative").default(0),
	employmentStatus: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
	joinDate: z.iso.datetime({ error: "Invalid date format" }),
	role: z
		.enum(["ADMIN", "EMPLOYEE"], {
			error: "Role must be ADMIN or EMPLOYEE",
		})
		.default("EMPLOYEE"),
	bio: z.string().max(500, "Bio cannot exceed 500 characters").default(""),
});

export const updateEmployeeSchema = createEmployeeSchema.required().partial();
