import { Navigate } from "react-router-dom";
import { toast } from 'react-toastify';
import { jwtDecode } from "jwt-decode";
import { rawAxios } from "../../main/auth";
import { REFRESH_TOKEN, ACCESS_TOKEN } from "../../main/constants";
import { useState, useEffect } from "react";

function ProtectedRoute({children}) {
    const [isAuthorised, setIsAuthorised] = useState(null);

    useEffect(() => {
        auth().catch(() => setIsAuthorised(false));
    }, []);

    const refreshToken = async () => {
        const refreshToken = localStorage.getItem(REFRESH_TOKEN);
        try {
            const res = await rawAxios.post("/user/token/refresh/", {
                refresh: refreshToken
            });
            if (res.status === 200) {
                localStorage.setItem(ACCESS_TOKEN, res.data.access);
                setIsAuthorised(true);
            } else {
                setIsAuthorised(false);
            }
        } catch (error) {
            setIsAuthorised(false);
            toast.error("Token refresh failed");
        }
    }

    const auth = async () => {
        const token = localStorage.getItem(ACCESS_TOKEN);
        if (!token) {
            setIsAuthorised(false);
            return
        }
        const decoded = jwtDecode(token);
        const tokenExpiration = decoded.exp;
        const now = Date.now() / 1000;

        if (tokenExpiration < now) {
            await refreshToken();
        } else {
            setIsAuthorised(true);
        }
    }

    if (isAuthorised === null) {
        return <div>Loading...</div>
    }

    return isAuthorised ? children : <Navigate to="/login" />
}

export default ProtectedRoute;
