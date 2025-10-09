import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Login.module.css';
import api from "../main/api";
import { useAuth } from './components/AuthContext';

function Login() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const { user, setUser, logout } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const login = await api.login(email, password);
            if (login) {
                const res = await api.get("/user/profile/");
                setUser(res.data);
                navigate("/");
            }
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
        <div className={styles.body}>
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
        </div>
    );
}

export default Login;
