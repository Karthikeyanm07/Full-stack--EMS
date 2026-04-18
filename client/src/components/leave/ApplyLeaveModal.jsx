import { CalendarDays, FileText, Loader2, Send, X } from "lucide-react";
import { useState, useEffect } from "react";
import api from "../../api/axios.js";
import toast from "react-hot-toast";

const ApplyLeaveModal = ({ open, onClose, onSuccess }) => {
	const [loading, setLoading] = useState(false);

	const today = new Date();
	const tomorrow = new Date(today);
	tomorrow.setDate(today.getDate() + 1); // April 12 -> April 13
	const minDate = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, "0")}-${String(tomorrow.getDate()).padStart(2, "0")}`;

	// console.log(minDate); 2026-04-13T09:46:26.699Z

	const handleSubmit = async (e) => {
		e.preventDefault();

		const formData = new FormData(e.currentTarget);
		const data = Object.fromEntries(formData.entries());

		// Basic check for date logic
		if (new Date(data.startDate) > new Date(data.endDate)) {
			return toast.error("End date cannot be before start date");
		}

		setLoading(true);
		try {
			await api.post("/leave", data);
			toast.success("Form submitted successfully");
			onSuccess();
			onClose();
		} catch (error) {
			toast.error(
				error.response?.data?.message || "Failed to submit form",
			);
		}
	};

	/*  If the modal closes while loading is true, it might stay "true" 
		the next time you open it. Add a useEffect to reset the state whenever the open prop changes: */
	useEffect(() => {
		if (!open) {
			setLoading(false);
		}
	}, [open]);

	if (!open) {
		return null;
	}
	return (
		// Apply Leave Form modal
		<div
			className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
			onClick={onClose}
		>
			<div
				className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-fade-in"
				onClick={(e) => e.stopPropagation()}
			>
				{/* Header */}
				<div className="flex items-center justify-between p-6 pb-0">
					<div>
						<h2 className="text-lg font-semibold text-slate-800">
							Apply for Leave
						</h2>
						<p className="text-sm text-slate-400 mt-0.5">
							Submit your leave request for approval
						</p>
					</div>
					<button
						className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600"
						onClick={onClose}
					>
						<X className="size-5" />
					</button>
				</div>

				{/* Leave form */}
				<form onSubmit={handleSubmit} className="p-6 space-y-5">
					{/* ------- Leave Types -------- */}
					<div>
						<label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
							<FileText className="size-4 text-slate-400" /> Leave
							Type
						</label>
						<select name="type" required>
							<option value="SICK">Sick Leave</option>
							<option value="CASUAL">Casual Leave</option>
							<option value="ANNUAL">Annual Leave</option>
						</select>
					</div>

					{/* ------- Duration -------- */}
					<div>
						<label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
							<CalendarDays className="size-4 text-slate-400" />{" "}
							Duration
						</label>
						<div className="grid grid-cols-2 gap-4">
							<div>
								<span className="block text-xs text-slate-400 mb-1">
									From
								</span>
								<input
									type="date"
									name="startDate"
									required
									min={minDate}
								/>
							</div>
							<div>
								<span className="block text-xs text-slate-400 mb-1">
									To
								</span>
								<input
									type="date"
									name="endDate"
									required
									min={minDate}
								/>
							</div>
						</div>
					</div>
					{/* ------- reason -------- */}
					<div>
						<label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
							Reason
						</label>
						<textarea
							name="reason"
							required
							rows={3}
							placeholder="Briefly describe why you need this leave..."
							className="resize-none"
						></textarea>
					</div>
					{/* ------- buttons -------- */}
					<div className="flex gap-3 pt-2">
						<button
							type="button"
							className="btn-secondary flex-1"
							onClick={onClose}
						>
							Cancel
						</button>
						<button
							type="submit"
							className="btn-primary flex-1 flex items-center justify-center gap-2"
							disabled={loading}
						>
							{loading ? (
								<Loader2 className="size-4 animate-spin" />
							) : (
								<Send className="size-4" />
							)}
							{loading ? "Submitting..." : "Submit"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};

export default ApplyLeaveModal;
