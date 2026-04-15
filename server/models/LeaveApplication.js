import mongoose from "mongoose";
const { Schema, model, models } = mongoose;

const leaveApplicationSchema = new Schema(
	{
		employeeId: {
			type: Schema.Types.ObjectId,
			ref: "Employee",
			required: true,
		},
		type: {
			type: String,
			enum: ["SICK", "CASUAL", "ANNUAL"],
			required: true,
		},
		startDate: {
			type: Date,
			required: true,
		},
		endDate: {
			type: Date,
			required: true,
		},
		reason: {
			type: String,
			required: true,
		},
		status: {
			type: String,
			enum: ["PENDING", "APPROVED", "REJECTED"],
			default: "PENDING",
		},
	},
	{ timestamps: true },
);

const LeaveApplication =
	models.LeaveApplication ||
	model("LeaveApplication", leaveApplicationSchema);

export default LeaveApplication