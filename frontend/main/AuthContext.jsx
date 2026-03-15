import { useNavigate } from "react-router-dom";
import { createContext, useContext, useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";

import {
    setTokens,
    getTokens,
    clearTokens,
    getDeviceId,
    setDeviceId,
} from "./authStorage";
import { authApi } from "./authApi";
import api from "./api";

export const AuthContext = createContext();

const isExpired = (exp) => {
    if (!exp) return true;
    const now = Math.floor(Date.now() / 1000);
    return exp < now;
};

export function AuthProvider({ children }) {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [authType, setAuthType] = useState(null); // guest | registered

    const fetchUser = async () => {
        try {
            const res = await api.get("/user/profile/");
            setUser(res.data);
        } catch (err) {
            console.error("Failed to fetch user:", err);
            setUser(null);
        }
    };

    const login = async (email, password) => {
        try {
            const res = await authApi.post("/user/login/", { email, password });

            const { access_token_exp, refresh_token_exp } = res.data;

            await setTokens(access_token_exp, refresh_token_exp, "registered");

            setAuthType("registered");
            await fetchUser();
        } catch (err) {
            throw err;
        }
    };

    const guestLogin = async () => {
        try {
            let device_id = getDeviceId();

            if (!device_id) {
                device_id = uuidv4();
                setDeviceId(device_id);
            }

            const res = await authApi.post("/user/guest/", {
                device_id,
            });

            const { access_token_exp, refresh_token_exp } = res.data;

            setTokens(access_token_exp, refresh_token_exp, "guest");

            setAuthType("guest");
            await fetchUser();
        } catch (err) {
            throw err;
        }
    };

    const refreshAccessToken = async (type) => {
        try {
            const res = await authApi.post("/user/refresh/");

            const { access_token_exp, refresh_token_exp } = res.data;

            setTokens(access_token_exp, refresh_token_exp, type);

            return access_token_exp;
        } catch {
            if (type === "guest") {
                return attemptGuestRestore();
            }
            await logout();
            return null;
        }
    };

    const attemptGuestRestore = async () => {
        const device_id = getDeviceId();
        if (!device_id) return null;

        try {
            const res = await authApi.post("/user/guest/", { device_id });
            const { msg, access_token_exp, refresh_token_exp } = res.data;

            setTokens(access_token_exp, refresh_token_exp, "guest");
            setAuthType("guest");
            return access_token;
        } catch {
            await logout();
            return null;
        }
    };

    const logout = async () => {
        await api.post("/user/logout/");
        clearTokens();
        setAuthType(null);
        setUser(null);
    };

    useEffect(() => {
        const initialize = async () => {
            const { access_exp, refresh_exp, type } = getTokens();

            if (!access_exp || !refresh_exp || !type) {
                setLoading(false);
                return;
            }

            try {
                if (!isExpired(access_exp)) {
                    setAuthType(type);
                } else if (!isExpired(refresh_exp)) {
                    await refreshAccessToken(type);
                    setAuthType(type);
                } else if (type === "guest") {
                    await attemptGuestRestore();
                } else {
                    await logout();
                    setLoading(false);
                    return;
                }
                await fetchUser();
            } catch (err) {
                console.error("Auth init failed", err);
                await logout();
            }

            setLoading(false);
        };

        initialize();
    }, []);

    return (
        <AuthContext.Provider
            value={{
                authType,
                user,
                setUser,
                loading,
                login,
                guestLogin,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}
