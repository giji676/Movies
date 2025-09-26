import { Navigate } from "react-router-dom";
import { toast } from 'react-toastify';
import api from "../../main/api";
import { useState, useEffect } from "react";
import { useAuth } from "./AuthContext";

function ProtectedRoute({children}) {
    const { user, loading } = useAuth();

    if (loading) return <div>Loading...</div>;

    return user ? children : <Navigate to="/login" />;
}

export default ProtectedRoute;
