import { Navigate } from "react-router-dom";
import { toast } from 'react-toastify';
import api from "../../main/api";
import { useState, useEffect } from "react";

function ProtectedRoute({children}) {
    const [isAuthorised, setIsAuthorised] = useState(null);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const token = await api.checkAuth();
                setIsAuthorised(!!token);
            } catch {
                setIsAuthorised(false);
            }
        };
        checkAuth();
    }, []);

    if (isAuthorised === null) {
        return <div>Loading...</div>
    }

    return isAuthorised ? children : <Navigate to="/login" />
}

export default ProtectedRoute;
