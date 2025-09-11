import axios from "axios";
import { REFRESH_TOKEN, ACCESS_TOKEN } from "./constants";
import { jwtDecode } from "jwt-decode";

const rawAxios = axios.create({
    baseURL: import.meta.env.VITE_BACKEND_URL,
});

export async function checkAuth() {
    const accessToken = localStorage.getItem(ACCESS_TOKEN);
    if (!accessToken) return null;

    try {
        const decoded = jwtDecode(accessToken);
        const tokenExpiration = decoded.exp;
        const now = Date.now() / 1000;

        if (tokenExpiration < now) {
            const newToken = await refreshAccessToken();
            if (!newToken) {
                throw new Error("Token refresh failed");
            }
            return newToken;
        }

        return accessToken;
    } catch (error) {
        console.error("Auth check failed:", error);
        throw error; // important
    }
}

async function refreshAccessToken() {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN);
    if (!refreshToken) return null;

    try {
        const res = await rawAxios.post("/api/user/token/refresh/", {
            refresh: refreshToken
        });

        if (res.status === 200) {
            localStorage.setItem(ACCESS_TOKEN, res.data.access);
            return res.data.access;
        }

        return null;
    } catch (error) {
        console.error("Failed to refresh token:", error);
        return null;
    }
}
