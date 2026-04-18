import axios from "axios";

const api = axios.create({
	baseURL: (import.meta.VITE_BASE_URL || "http://localhost:5000") + "/api",
});

// Attach Auth token to all requests
api.interceptors.request.use((config) => {
	const token = localStorage.getItem("token");

	if (token) {
		config.headers.Authorization = `Bearer ${token}`;
	}
	return config;
});

api.interceptors.response.use(
	(response) => {
		// Instead of returning the full Axios object, 
		// we return only the data your backend sent.
		return response.data;
	},
	(error) => {
		if (error.response && error.response.data) {
            // If the backend sent 'error', we map it to 'message' locally
            if (error.response.data.error && !error.response.data.message) {
                error.response.data.message = error.response.data.error;
            }
        }
		return Promise.reject(error);
	},
);

export default api;
