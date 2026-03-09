import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from "../main/useAuth";
import api from "../main/api";
import styles from './Login.module.css';

function Login() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loginLoading, setLoginLoading] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    // const { user, setUser, logout, setLoading } = useAuth();
    const { login, guestLogin } = useAuth();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");

        if (!email || !password) {
            setError("Email and password are required");
            return;
        }

        setLoading(true);
        try {
            await login(email.toLowerCase(), password);
            navigate("/");
        } catch (err) {
            setError(err?.response?.data?.error);
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async () => {
        e.preventDefault();
        setError("");

        if (!email || !password) {
            setError("All fields are required");
            return;
        }

        setLoading(true);
        try {
            await api.post("accounts/register/", {
                email: email.toLowerCase(),
                password,
            });

            // setMessageModalVisible(true);
        } catch (err) {
            setError(err?.response?.data?.error);
        } finally {
            setLoading(false);
        }
    };

    const handleGuest = async () => {
        e.preventDefault();
        setError("");

        try {
            await guestLogin(guestName);
            // setGuestModalVisible(false);
        } catch (err) {
            setError(err?.response?.data?.error);
        }
    };

    // TODO: Remove old funcs, update html to use new funcs

    return (
        <div className={styles.body}>
            <div className={styles.container}>
                <h1>Login</h1>
                {error && <div className={styles.error}>{error}</div>}
                <form className={styles.form} onSubmit={(e) => handleLogin(e)}>
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
                    <button type="submit" className={styles.button} disabled={loginLoading}>
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
