import { createContext, useContext, useState, useEffect } from "react";
import api from "../../main/api";

const AuthContext = createContext();

function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
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
        await api.post("/user/logout/");
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
