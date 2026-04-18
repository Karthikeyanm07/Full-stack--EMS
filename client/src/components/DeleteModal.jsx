import { Loader2Icon, AlertTriangleIcon } from "lucide-react";

const DeleteModal = ({ isOpen, onClose, onConfirm, loading, title }) => {
	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
			<div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden animate-scale-in">
				<div className="p-6">
					<div className="flex items-center justify-center size-12 bg-red-50 text-red-600 rounded-full mb-4">
						<AlertTriangleIcon className="size-6" />
					</div>

					<h3 className="text-lg font-semibold text-slate-900 text-center mb-2">
						{title || "Confirm Deletion"}
					</h3>
					<p className="text-slate-500 text-center text-sm">
						Are you sure you want to deactivate this record? This
						action cannot be easily undone.
					</p>
				</div>

				<div className="bg-slate-50 p-4 flex flex-col-reverse sm:flex-row justify-end gap-3">
					<button
						type="button"
						className="btn-secondary sm:w-24"
						onClick={onClose}
						disabled={loading}
					>
						Cancel
					</button>
					<button
						type="button"
						className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center sm:w-32 transition-colors disabled:opacity-70"
						onClick={onConfirm}
						disabled={loading}
					>
						{loading ? (
							<Loader2Icon className="size-4 animate-spin mr-2" />
						) : null}
						{loading ? "Deleting..." : "Yes, Delete"}
					</button>
				</div>
			</div>
		</div>
	);
};

export default DeleteModal;
