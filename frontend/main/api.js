import axios from "axios";
import { getCookie } from "./cookieUtils";
import { getTokens, setTokens, clearTokens } from "./authStorage";
import { authApi } from "./authApi";

const api = axios.create({
    baseURL: import.meta.env.VITE_BACKEND_URL,
    withCredentials: true,
});

api.interceptors.request.use(async (config) => {
    const csrfToken = getCookie('csrftoken');
    if (csrfToken) {
        config.headers['X-CSRFToken'] = csrfToken;
    }
    return config;
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            const { refresh_exp, type } = getTokens();
            if (!refresh_exp) {
                clearTokens();
                return Promise.reject(error);
            }

            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then((token_exp) => {
                        return api(originalRequest);
                    });
            }

            isRefreshing = true;

            try {
                const res = await authApi.post("accounts/refresh/");

                const { access_token_exp, refresh_token_exp } = res.data;

                setTokens(access_token_exp, refresh_token_exp, type);

                processQueue(null, access_token_exp);

                return api(originalRequest);
            } catch (err) {
                processQueue(err, null);
                clearTokens();
                return Promise.reject(err);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default api;
