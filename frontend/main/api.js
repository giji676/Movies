import axios from "axios";
import * as auth from "./auth";
import { getCookie } from "./cookieUtils";

const api = axios.create({
    baseURL: import.meta.env.VITE_BACKEND_URL,
    withCredentials: true,
});

api.interceptors.request.use((config) => {
    const csrfToken = getCookie('csrftoken');
    if (csrfToken) {
        config.headers['X-CSRFToken'] = csrfToken;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const ogRequest = error.config;

        if (error.response?.status === 401 && !ogRequest._retry) {
            ogRequest._retry = true;

            try {
                const refreshRes = await auth.refreshAccessToken();
                if (refreshRes) {
                    return api(ogRequest);
                }
            } catch (error) {
                toast.error(error);
            }

            toast.error("Session expired. Please log in again.");
        }
        return Promise.reject(error);
    }
)

api.login = async (email, password) => {
    return await auth.login(email, password);
};

api.logout = async () => {
    return await auth.logout();
};

api.register = async (email, username,  password) => {
    return await auth.register(email, username, password);
};

api.checkAuth = async () => {
    return await auth.checkAuth();
};

export default api;
