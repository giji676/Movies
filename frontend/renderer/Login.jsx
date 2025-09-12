import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../main/constants";
import styles from './Login.module.css';
import api from "../main/api";

function Login({ onLoginSuccess }) {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await api.post("/user/token/", { email, password });
            localStorage.setItem(ACCESS_TOKEN, res.data.access);
            localStorage.setItem(REFRESH_TOKEN, res.data.refresh);
            if (onLoginSuccess) onLoginSuccess();
            navigate("/");
        } catch (err) {
            if (err.response && err.response.data.detail) {
                setError(err.response.data.detail);
            } else {
                setError("Unable to connect to server.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <h1>Login</h1>
            {error && <div className={styles.error}>{error}</div>}
            <form className={styles.form} onSubmit={handleSubmit}>
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className={styles.input}
                    required
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className={styles.input}
                    required
                />
                <button type="submit" className={styles.button} disabled={loading}>
                    Login
                </button>
            </form>
            <p className={styles.text}>Don't have an account?</p>
            <p className={styles.link} onClick={() => navigate("/register")}>
                Register here
            </p>
        </div>
    );
}

export default Login;
