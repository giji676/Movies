import axios from "axios";
import { REFRESH_TOKEN, ACCESS_TOKEN } from "./constants";
import { jwtDecode } from "jwt-decode";
import { toast } from 'react-toastify';

export const authAxios = axios.create({
    baseURL: import.meta.env.VITE_BACKEND_URL,
});

export async function register(email, username, password) {
    try {
        await authAxios.post("/user/register/", { email, username, password });
    } catch {
        throw new Error("Login failed");
    }
}

export async function login(email, password) {
    try {
        const res = await authAxios.post("/user/token/", { email, password });
        localStorage.setItem(ACCESS_TOKEN, res.data.access);
        localStorage.setItem(REFRESH_TOKEN, res.data.refresh);
    } catch {
        throw new Error("Login failed");
    }
}

export async function checkAuth() {
    const accessToken = localStorage.getItem(ACCESS_TOKEN);
    if (!accessToken) {
        localStorage.removeItem(REFRESH_TOKEN);
        return null;
    }

    try {
        const decoded = jwtDecode(accessToken);
        const tokenExpiration = decoded.exp;
        const now = Date.now() / 1000;

        if (tokenExpiration < now) {
            const newToken = await refreshAccessToken();
            if (!newToken) {
                localStorage.removeItem(ACCESS_TOKEN);
                localStorage.removeItem(REFRESH_TOKEN);
                throw new Error("Token refresh failed");
            }
            return newToken;
        }

        return accessToken;
    } catch (error) {
        localStorage.removeItem(ACCESS_TOKEN);
        localStorage.removeItem(REFRESH_TOKEN);
        toast.error("Auth check failed");
        throw error;
    }
}

async function refreshAccessToken() {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN);
    if (!refreshToken) return null;

    try {
        const res = await authAxios.post("/user/token/refresh/", {
            refresh: refreshToken
        });

        if (res.status === 200) {
            localStorage.setItem(ACCESS_TOKEN, res.data.access);
            localStorage.setItem(REFRESH_TOKEN, res.data.refresh);
            return res.data.access;
        }

        return null;
    } catch (error) {
        toast.error("Failed to refresh token");
        return null;
    }
}
