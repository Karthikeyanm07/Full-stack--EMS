import { useCallback, useEffect, useState } from "react";
import Loading from "../components/Loading";
import CheckInButton from "../components/attendance/CheckInButton";
import AttendanceStats from "../components/attendance/AttendanceStats";
import AttendanceHistory from "../components/attendance/AttendanceHistory";
import api from "../api/axios.js";
import toast from "react-hot-toast";

const Attendance = () => {
	const [history, setHistory] = useState([]);
	const [loading, setLoading] = useState(true);
	const [isDeleted, setIsDeleted] = useState(false);

	const fetchData = useCallback(async () => {
		try {
			const response = await api.get("/attendance");

			const { history, employee } = response.data;
			setHistory(history || []);

			if (employee?.isDeleted) {
				setIsDeleted(true);
			}
		} catch (error) {
			toast.error(
				error.response?.data?.message || "Failed to fetch attendance",
			);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	if (loading) {
		return <Loading />;
	}

	const today = new Date(); // Sat Apr 11 2026 13:37:02 GMT+0530 (India Standard Time)
	today.setHours(0, 0, 0, 0); // Sat Apr 11 2026 00:00:00 GMT+0530 (India Standard Time)
	const todayRecord = history.find(
		(r) => new Date(r.date).toDateString() === today.toDateString(),
	);
	return (
		<div className="animate-fade-in">
			<div className="page-header">
				<h1 className="page-title">Attendance</h1>
				<p className="page-subtitle">
					Track your work hours and daily check-ins
				</p>
			</div>
			{isDeleted ? (
				<div className="mb-8 p-6 bg-rose-50 border border-rose-200 rounded-2xl txt-center">
					<p className="text-rose-600">
						You can no longer clock in or out because your employee
						records have been marked as deleted.
					</p>
				</div>
			) : (
				<div className="mb-8">
					<CheckInButton
						todayRecord={todayRecord}
						onAction={fetchData}
					/>
				</div>
			)}
			<AttendanceStats history={history} />
			<AttendanceHistory history={history} />
		</div>
	);
};

export default Attendance;
