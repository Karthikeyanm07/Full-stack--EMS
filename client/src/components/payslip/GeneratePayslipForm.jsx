import { Loader2, Plus, X } from "lucide-react";
import { useState } from "react";
import api from "../../api/axios.js";
import toast from "react-hot-toast";

const GeneratePayslipForm = ({ employees, onSuccess }) => {
	const [loading, setLoading] = useState(false);
	const [isOpen, setIsOpen] = useState(false);
	// state to hold the salary fields
	const [salaryData, setSalaryData] = useState({
		basicSalary: 0,
		allowances: 0,
		deductions: 0,
	});

	if (!isOpen) {
		return (
			<button
				className="btn-primary flex items-center gap-2"
				onClick={() => setIsOpen(true)}
			>
				<Plus className="size-4" /> Generate Payslip
			</button>
		);
	}

	const months = [
		"January",
		"February",
		"March",
		"April",
		"May",
		"June",
		"July",
		"August",
		"September",
		"October",
		"November",
		"December",
	];

	// Function to update fields when an employee is selected
	const handleEmployeeChange = (e) => {
		const selectedId = e.target.value;
		const employee = employees.find((emp) => emp.id === selectedId);

		if (employee) {
			setSalaryData({
				basicSalary: employee.basicSalary || 0,
				allowances: employee.allowances || 0,
				deductions: employee.deductions || 0,
			});
		}
	};
	const handleSubmit = async (e) => {
		e.preventDefault();
		setLoading(true);

		const formData = new FormData(e.currentTarget);
		const data = Object.fromEntries(formData.entries());

		data.basicSalary = Number(data.basicSalary);
		data.allowances = Number(data.allowances);
		data.deductions = Number(data.deductions);
		data.month = Number(data.month);
		data.year = Number(data.year);

		try {
			await api.post("/payslips", data);
			toast.success("Payslip generated successfully!");
			setIsOpen(false);
			onSuccess();
		} catch (error) {
			toast.error(
				error.response?.data?.message || "Failed to create payslip",
			);
		} finally {
			setLoading(false);
		}
	};

	const handleClose = () => {
		setIsOpen(false);
		setSalaryData({ basicSalary: 0, allowances: 0, deductions: 0 });
	};

	// Net salary
	const netSalary =
		salaryData.basicSalary + salaryData.allowances - salaryData.deductions;

	return (
		<div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
			<div className="card max-w-lg w-full p-6 animate-slide-up">
				<div className="flex justify-between items-center mb-6">
					<h3 className="text-lg font-bold text-slate-900">
						Generate Monthly Payslip
					</h3>
					<button
						className="text-slate-400 hover:text-slate-600 p-1"
						onClick={handleClose}
					>
						<X size={20} />
					</button>
				</div>
				<form className="space-y-4" onSubmit={handleSubmit}>
					{/* Select employee */}
					<div>
						<label className="block text-sm font-medium text-slate-700 mb-2">
							Employee
						</label>
						<select
							name="employeeId"
							required
							onChange={handleEmployeeChange}
						>
							<option value="">Select Employee</option>
							{employees.map((e) => (
								<option key={e.id} value={e.id}>
									{e.firstName} {e.lastName} ({e.position})
								</option>
							))}
						</select>
					</div>
					{/* Select month and year */}
					<div className="grid grid-cols-2 gap-4">
						<div>
							<label className="block text-sm font-medium text-slate-700 mb-2">
								Month
							</label>
							<select
								name="month"
								defaultValue={new Date().getMonth() + 1}
							>
								{months.map((month, index) => (
									<option value={index + 1} key={index}>
										{month}
									</option>
								))}
							</select>
						</div>
						<div>
							<label className="block text-sm font-medium text-slate-700 mb-2">
								Year
							</label>
							<input
								type="number"
								name="year"
								defaultValue={new Date().getFullYear()}
								min="2000"
								required
							/>
						</div>
					</div>
					{/* Basic salary */}
					<div>
						<label className="block text-sm font-medium text-slate-700 mb-2">
							Basic Salary
						</label>
						<input
							type="number"
							name="basicSalary"
							value={salaryData.basicSalary}
							onChange={(e) =>
								setSalaryData({
									...salaryData,
									basicSalary: Number(e.target.value),
								})
							}
							required
							placeholder="5000"
							min="0"
						/>
					</div>
					{/* Allownaces & Deuctions */}
					<div className="grid grid-cols-2 gap-4">
						<div>
							<label className="block text-sm font-medium text-slate-700 mb-2">
								Allowances
							</label>
							<input
								type="number"
								name="allowances"
								value={salaryData.allowances}
								onChange={(e) =>
									setSalaryData({
										...salaryData,
										allowances: Number(e.target.value),
									})
								}
								defaultValue="0"
								min="0"
							/>
						</div>
						<div>
							<label className="block text-sm font-medium text-slate-700 mb-2">
								Deductions
							</label>
							<input
								type="number"
								name="deductions"
								value={salaryData.deductions}
								onChange={(e) =>
									setSalaryData({
										...salaryData,
										deductions: Number(e.target.value),
									})
								}
								defaultValue="0"
								min="0"
							/>
						</div>
					</div>
					{/* Net salary */}
					<div className="p-3 bg-indigo-50 rounded-lg mb-4">
						<div className="flex justify-between items-center text-sm">
							<span className="text-indigo-600 font-medium">
								Estimated Net Salary:
							</span>
							<span className="text-indigo-700 text-lg font-mono font-medium">
								₹ {netSalary.toLocaleString()}
							</span>
						</div>
					</div>

					{/* Buttons */}
					<div className="flex justify-end gap-3 pt-2">
						<button
							type="button"
							className="btn-secondary"
							onClick={handleClose}
						>
							Cancel
						</button>
						<button
							type="submit"
							className="btn-primary flex items-center"
							disabled={loading}
						>
							{loading && (
								<Loader2 className="size-4 mr-2 animate-spin" />
							)}
							Generate
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};

export default GeneratePayslipForm;
