import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../main/constants";
import styles from './Login.module.css';
import api from "../main/api";

function Login({ route, method }) {
    const location = useLocation();
    const navigate = useNavigate();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const register = method === "register";

    const BASE_URL = import.meta.env.VITE_BACKEND_URL;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setMessage("");

        try {
            const res = await api.post(route, {username, password});
            if (!register) {
                localStorage.setItem(ACCESS_TOKEN, res.data.access);
                localStorage.setItem(REFRESH_TOKEN, res.data.refresh);
                navigate("/");
            } else {
                setMessage("Registered, redirecting to login");
                navigate("/login");
            }
        } catch (err) {
            if (err.response && err.response.data) {
                const data = err.response.data;
                if (data.detail) {
                    setError(data.detail); // e.g., "No active account found..."
                } else if (typeof data === 'object') {
                    // For DRF field-specific errors (like {"username": ["This field is required."]})
                    const messages = Object.values(data).flat().join(" ");
                    setError(messages);
                } else {
                    setError("An unknown error occurred.");
                }
            } else {
                setError("Unable to connect to server.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <h1>{register ? "Register" : "Login"}</h1>
            {error && <div className={styles.error}>{error}</div>}
            {message && <div className={styles.message}>{message}</div>}
            <form className={styles.form} onSubmit={handleSubmit}>
                <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className={styles.input}
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={styles.input}
                />
                <button type="submit" className={styles.button}>
                    {register ? "Register" : "Login"}
                </button>
            </form>

            {!register && (
                <>
                    <p className={styles.text}>
                        Don't have an account?{" "}
                    </p>
                    <p className={styles.link} onClick={() => (navigate("/register"))}>
                        Register here
                    </p>
                </>
            )}

            {register && (
                <>
                    <p className={styles.text}>
                        Already have an account?{" "}
                    </p>
                    <p className={styles.link} onClick={() => (navigate("/login"))}>
                        Login here
                    </p>
                </>
            )}
        </div>
    );
}

export default Login;
