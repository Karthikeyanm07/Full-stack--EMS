import { z } from "zod";
import { DEPARTMENTS } from "../constants/departments.js";

export const createEmployeeSchema = z.object({
	firstName: z
		.string()
		.min(2, "First name must be at least 2 characters")
		.max(50, "First name cannot exceed 50 characters"),
	lastName: z
		.string()
		.min(1, "Last name must be at least 1 characters")
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
	basicSalary: z.coerce.number().positive("Salary must be greater than 0"),
	allowances: z.coerce
		.number()
		.min(0, "Allowances cannot be negative")
		.default(0),
	deductions: z.coerce
		.number()
		.min(0, "Deductions cannot be negative")
		.default(0),
	employmentStatus: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
	joinDate: z.coerce.date({ error: "Invalid date format" }),
	role: z
		.enum(["ADMIN", "EMPLOYEE"], {
			error: "Role must be ADMIN or EMPLOYEE",
		})
		.default("EMPLOYEE"),
	bio: z.string().max(500, "Bio cannot exceed 500 characters").default(""),
});

export const updateEmployeeSchema = createEmployeeSchema.partial().extend({
	password: z.string().min(8).optional().or(z.literal("")),
});

export const createPayslipSchema = z.object({
	employeeId: z.string(),
	year: z.coerce.number().min(2000).max(new Date().getFullYear()), // Turns "2024" into 2024
	month: z.coerce.number().min(1).max(12),
	basicSalary: z.coerce
		.number()
		.nonnegative("Basic salary must be greater than 0"),
	allowances: z.coerce
		.number()
		.min(0, "Allowances cannot be negative")
		.default(0),
	deductions: z.coerce
		.number()
		.min(0, "Deductions cannot be negative")
		.default(0),
});
