import axios from "axios";
import { REFRESH_TOKEN, ACCESS_TOKEN } from "./constants";
import * as auth from "./auth";

const api = axios.create({
    baseURL: import.meta.env.VITE_BACKEND_URL,
});

api.interceptors.request.use(
    async (config) => {
        const token = await auth.checkAuth();

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
            return config;
        } else {
            return null;
        }
    },
    (error) => {
        return Promise.reject(error);
    }
)

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const ogRequest = error.config;

        if (error.response?.status === 401 && !ogRequest._retry) {
            ogRequest._retry = true;

            try {
                const newToken = await auth.refreshAccessToken();
                if (newToken) {
                    ogRequest.headers.Authorization = `Bearer ${newToken}`;
                    return api(ogRequest);
                }
            } catch (error) {
                toast.error(error);
            }

            localStorage.removeItem(ACCESS_TOKEN);
            localStorage.removeItem(REFRESH_TOKEN);
            toast.error("Session expired. Please log in again.");
        }
        return Promise.reject(error);
    }
)

api.login = async (email, password) => {
    return await auth.login(email, password);
};

api.register = async (email, username,  password) => {
    return await auth.register(email, username, password);
};

api.checkAuth = async () => {
    return await auth.checkAuth();
};

export default api;
