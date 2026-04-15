import mongoose from "mongoose";
const { Schema, model, models } = mongoose;

const userSchema = new Schema(
	{
		email: {
			type: String,
			required: true,
			unique: true,
		},
		password: {
			type: String,
			required: true,
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
