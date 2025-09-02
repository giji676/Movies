import { jwtDecode } from "jwt-decode";
import api from "./api";
import { REFRESH_TOKEN, ACCESS_TOKEN } from "./constants";

export async function checkAuth() {
    const accessToken = localStorage.getItem(ACCESS_TOKEN);
    if (!accessToken) {
        return false;
    }

    try {
        const decoded = jwtDecode(accessToken);
        const tokenExpiration = decoded.exp;
        const now = Date.now() / 1000;

        if (tokenExpiration < now) {
            const refreshed = await refreshAccessToken();
            return refreshed;
        }

        return true;
    } catch (error) {
        console.error("Auth check failed:", error);
        return false;
    }
}

async function refreshAccessToken() {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN);
    if (!refreshToken) return false;

    try {
        const res = await api.post("/api/user/token/refresh/", {
            refresh: refreshToken
        });

        if (res.status === 200) {
            localStorage.setItem(ACCESS_TOKEN, res.data.access);
            return true;
        }

        return false;
    } catch (error) {
        console.error("Failed to refresh token:", error);
        return false;
    }
}
