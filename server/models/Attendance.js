import mongoose from "mongoose";
const { Schema, model, models } = mongoose;

const attendanceSchema = new Schema(
	{
		employeeId: {
			type: Schema.Types.ObjectId,
			ref: "Employee",
			required: true,
		},
		date: {
			type: Date,
			required: true,
		},
		checkIn: {
			type: Date,
			default: null,
		},
		checkOut: {
			type: Date,
			default: null,
		},
		status: {
			type: String,
			enum: ["PRESENT", "ABSENT", "LATE"],
			default: "PRESENT",
		},
		workingHours: {
			type: Number,
			default: null,
		},
		dayType: {
			type: String,
			enum: [
				"Full Day",
				"Three Quarter Day",
				"Half Day",
				"Short Day",
				null,
			],
			default: null,
		},
	},
	{ timestamps: true },
);

attendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });

const Attendance = models.Attendance || model("Attendance", attendanceSchema);

export default Attendance;
