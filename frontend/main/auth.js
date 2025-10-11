import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { toast } from 'react-toastify'; import { getCookie } from "./cookieUtils";
import { clearUser } from "./authStore";

export const authAxios = axios.create({
    baseURL: import.meta.env.VITE_BACKEND_URL,
    withCredentials: true,
});

authAxios.interceptors.request.use((config) => {
    const csrfToken = getCookie('csrftoken');
    if (csrfToken) {
        config.headers['X-CSRFToken'] = csrfToken;
    }
    return config;
});

export async function register(email, username, password) {
    try {
        const res = await authAxios.post("/user/register/", { email, username, password });
        if (res.status === 201) return true;
        return false;
    } catch {
        throw new Error("Failed to register");
    }
}

export async function login(email, password) {
    try {
        const res = await authAxios.post("/user/login/", { email, password });
        if (res.status === 200) {
            localStorage.setItem("prev_logged_in", true);
            return true;
        }
        else return false;
    } catch {
        throw new Error("Login failed");
    }
}

export async function logout(email, password) {
    try {
        const res = await authAxios.post("/user/logout/");
        if (res.status === 200) {
            localStorage.setItem("prev_logged_in", false);
            return true;
        }
        else return false;
    } catch {
        return false;
        // throw new Error("Logout failed");
    } finally {
        localStorage.setItem("prev_logged_in", false);
    }
}

export async function refreshAccessToken() {
    const prevLogin = localStorage.getItem("prev_logged_in");
    if (!prevLogin || prevLogin === "false") {
        return false;
    }

    try {
        const res = await authAxios.post("/user/refresh/");
        if (res.status === 200) return true;
        clearUser();
        return false;
    } catch (error) {
        toast.error("Failed to refresh token");
        clearUser();
        return false;
    }
}
