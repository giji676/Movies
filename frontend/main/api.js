import axios from "axios";
import * as auth from "./auth";

console.log(import.meta.env.VITE_BACKEND_URL);

const api = axios.create({
    baseURL: import.meta.env.VITE_BACKEND_URL,
});

api.interceptors.request.use(
    async (config) => {
        const token = await auth.checkAuth();

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
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
