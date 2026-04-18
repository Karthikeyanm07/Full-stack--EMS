import { Loader2Icon, LockIcon, X } from "lucide-react";
import { useState } from "react";
import api from "../api/axios.js";

const ChangePasswordModal = ({ open, onClose }) => {
	const [loading, setLoading] = useState(false);
	const [message, setMessage] = useState({ type: "", text: "" });

	const handleSubmit = async (e) => {
		e.preventDefault();

		setLoading(true);
		setMessage({ type: "", text: "" });
		const formData = new FormData(e.currentTarget);
		const currentPassword = formData.get("currentPassword");
		const newPassword = formData.get("newPassword");

		try {
			const response = await api.post("/auth/change-password", {
				currentPassword,
				newPassword,
			});

			console.log(response);

			if (response.success) {
				setMessage({
					type: "success",
					text: response.message || "Password updated successfully",
				});
				e.target.reset();
				// Optional: Close modal after a delay
				setTimeout(() => onClose(), 2000);
			}
		} catch (error) {
			const errorText =
				error.response?.data?.message || "Something went wrong";
			setMessage({ type: "error", text: errorText });
		} finally {
			setLoading(false);
		}
	};

	if (!open) {
		return null;
	}
	return (
		<div
			className="fixed inset-0 flex items-center justify-center p-4"
			onClick={onClose}
		>
			<div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
			<div
				className="absolute bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fade-in"
				onClick={(e) => e.stopPropagation()}
			>
				<div className="flex items-center justify-between p-6 pb-0">
					<h2 className="text-lg font-medium text-slate-900 flex items-center gap-2">
						<LockIcon className="size-5 text-slate-400" />
						Change Password
					</h2>
					<button
						className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600"
						onClick={onClose}
					>
						<X className="size-5" />
					</button>
				</div>
				<form className="p-6 space-y-5" onSubmit={handleSubmit}>
					{message.text && (
						<div
							className={`p-3 rounded-xl text-sm flex items-start gap-3 ${
								message.type === "success"
									? "bg-emerald-50 text-emerald-700 border border-emerald-200"
									: "bg-rose-50 text-rose-700 border border-rose-200"
							}`}
						>
							<div
								className={`size-1.5 rounded-full mt-1.5 shrink-0 ${
									message.type === "success"
										? "bg-emerald-500"
										: "bg-rose-500"
								}`}
							/>
							{message.text}
						</div>
					)}
					<div>
						<label className="block text-sm font-medium text-slate-700">
							Current Password
						</label>
						<input
							type="password"
							name="currentPassword"
							required
						/>
					</div>
					<div>
						<label className="block text-sm font-medium text-slate-700">
							New Password
						</label>
						<input type="password" name="newPassword" required />
					</div>
					<div className="flex gap-3 pt-2">
						<button
							type="button"
							onClick={onClose}
							className="btn-secondary flex-1"
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={loading}
							className="btn-primary flex-1 flex justify-center items-center gap-2"
						>
							{loading && (
								<Loader2Icon className="size-4 animate-spin" />
							)}
							Update Password
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};

export default ChangePasswordModal;
