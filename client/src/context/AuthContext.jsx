import { createContext, useEffect, useState } from "react";
import api from "../api/axios.js";

// Export the context so the hook can use it
export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
	const [user, setUser] = useState(null);
	const [token, setToken] = useState(localStorage.getItem("token"));
	const [loading, setLoading] = useState(true);

	const refreshSession = async () => {
		const storedToken = localStorage.getItem("token");
		if (!storedToken) {
			setUser(null);
			setToken(null);
			setLoading(false);
			return;
		}
		try {
			const response = await api.get("/auth/session");
			setUser(response.data.user);
		} catch (error) {
			localStorage.removeItem("token");
			setUser(null);
			setToken(null);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		refreshSession();
	}, []);

	const login = async (email, password, role_type) => {
		const response = await api.post("/auth/login", {
			email,
			password,
			role_type,
		});

		const { user, token } = response.data;

		localStorage.setItem("token", token);
		setToken(token);
		setUser(user);
		return user;
	};

	const logout = async () => {
		localStorage.removeItem("token");
		setToken(null);
		setUser(null);
	};

	const value = { user, token, loading, login, logout, refreshSession };
	return (
		<AuthContext.Provider value={value}>{children}</AuthContext.Provider>
	);
}
