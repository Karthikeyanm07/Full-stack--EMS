import { useCallback, useEffect, useState } from "react";
import Loading from "../components/Loading";
import GeneratePayslipForm from "../components/payslip/GeneratePayslipForm";
import PayslipList from "../components/payslip/PayslipList";
import { useAuth } from "../hooks/useAuth.js";
import api from "../api/axios.js";
import toast from "react-hot-toast";

const Payslips = () => {
	const [paySlips, setPaySlips] = useState([]);
	const [employees, setEmployees] = useState([]);
	const [loading, setLoading] = useState(true);

	const { user } = useAuth();

	const isAdmin = user?.role === "ADMIN";

	const fetchPayslips = useCallback(async () => {
		try {
			const response = await api.get("/payslips");
			setPaySlips(response.data || []);
		} catch (error) {
			toast.error(
				error.response?.data?.message || "Failed to fetch payslips",
			);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchPayslips();
	}, [fetchPayslips]);

	useEffect(() => {
		if (isAdmin) {
			const fetchEmployeesForPayslips = async () => {
				try {
					const response = await api.get("/employees");

					// These employees is available, so we can only create Payslip for them
					const filtered = response.data.filter(
						(employee) => !employee.isDeleted,
					);

					setEmployees(filtered);
				} catch (error) {
					toast.error(
						error.response?.data?.message ||
							"Failed to fetch payslip employees",
					);
				}
			};
			fetchEmployeesForPayslips();
		}
	}, [isAdmin]);

	if (loading) {
		return <Loading />;
	}
	return (
		<div className="animate-fade-in">
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center hap-4 mb-8">
				<div>
					<h1 className="page-title">Payslips</h1>
					<p className="page-subtitle">
						{isAdmin
							? "Generate and manage employee payslips"
							: "Your payslip history"}
					</p>
				</div>
				{isAdmin && (
					<GeneratePayslipForm
						employees={employees}
						onSuccess={fetchPayslips}
					/>
				)}
			</div>
			<PayslipList paySlips={paySlips} isAdmin={isAdmin} />
		</div>
	);
};

export default Payslips;
