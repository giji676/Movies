import { useNavigate } from "react-router-dom";
import { createContext, useContext, useState, useEffect } from "react";
import { registerSetUser } from "../../main/authStore";
import api from "../../main/api";

const AuthContext = createContext();

function AuthProvider({ children }) {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        registerSetUser(setUser);
    }, []);
    
    useEffect(() => {
        const initAuth = async () => {
            const prevLogin = localStorage.getItem("prev_logged_in");
            if (!(!!prevLogin)) {
                navigate("/login");
                setUser(null);
                return;
            }
            try {
                const res = await api.get("/user/profile/");
                if (res.status === 200) {
                    setUser(res.data);
                } else {
                    // Failed to fetch profile
                }
            } catch {
                setUser(null);
            } finally {
                setLoading(false);
            }
        };
        initAuth();
    }, []);

    const logout = async () => {
        await api.logout();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, setUser, loading, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export default AuthProvider;

export function useAuth() {
    return useContext(AuthContext);
}
