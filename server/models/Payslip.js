import mongoose from "mongoose";
const { Schema, model, models } = mongoose;

const payslipSchema = new Schema(
	{
		employeeId: {
			type: Schema.Types.ObjectId,
			ref: "Employee",
			required: true,
		},
		year: {
			type: Number,
			required: true,
		},
		month: {
			type: Number,
			required: true,
		},
		basicSalary: {
			type: Number,
			required: true,
		},
		allowances: {
			type: Number,
			default: 0,
		},
		deductions: {
			type: Number,
			default: 0,
		},
		netSalary: {
			type: Number,
			required: true,
		},
	},
	{ timestamps: true },
);

payslipSchema.index({ employeeId: 1, year: 1, month: 1 }, { unique: true });

const Payslip = models.Payslip || model("Payslip", payslipSchema);

export default Payslip;
