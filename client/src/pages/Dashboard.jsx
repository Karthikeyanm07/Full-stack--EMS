import { useEffect, useState } from "react";
import {
	dummyAdminDashboardData,
	dummyEmployeeDashboardData,
} from "../assets/data";
import Loading from "../components/Loading";
import EmployeeDashboard from "../components/EmployeeDashboard";
import AdminDashboard from "../components/AdminDashboard";
import api from "../api/axios.js";
import toast from "react-hot-toast";

const Dashboard = () => {
	const [data, setData] = useState(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchDashboard = async () => {
			try {
				const response = await api.get("/dashboard");

				setData(response.data);
			} catch (error) {
				toast.error(error.response?.data?.message || error?.message);
			} finally {
				setLoading(false);
			}
		};
		fetchDashboard();
	}, []);
	
	// Error components
	if (loading) {
		return <Loading />;
	}
	if (!data) {
		return (
			<p className="text-center text-slate-500 py-12">
				Failed to load dashboard
			</p>
		);
	}
	if (data.role === "ADMIN") {
		return <AdminDashboard data={data} />;
	} else {
		return <EmployeeDashboard data={data} />;
	}
};

export default Dashboard;
