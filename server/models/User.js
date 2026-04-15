import mongoose from "mongoose";
const { Schema, model, models } = mongoose;

const userSchema = new Schema(
	{
		email: {
			type: String,
			required: true,
			unique: true,
			trim: true,
			lowercase: true,
		},
		password: {
			type: String,
			required: true,
            select: false,
		},
		role: {
			type: String,
			enum: ["ADMIN", "EMPLOYEE"],
			default: "EMPLOYEE",
		},
	},
	{ timestamps: true },
);

const User = models.User || model("User", userSchema);

export default User;
