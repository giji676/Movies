import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from "../main/useAuth";
import api from "../main/api";
import styles from './Login.module.css';

function Login() {
    const navigate = useNavigate();

    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [loading, setLoading] = useState(false);
    const [isRegistering, setIsRegistering] = useState(false);

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
        }
        setLoading(false);
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setError("");

        if (!email || !password) {
            setError("All fields are required");
            return;
        }

        setLoading(true);
        try {
            await api.post("/user/register/", {
                email: email.toLowerCase(),
                password,
                username,
            });
            resetForm(false);

            // setMessageModalVisible(true);
        } catch (err) {
            const data = err?.response?.data;

            if (data?.error) {
                setError(data.error);
            } else if (data) {
                const firstKey = Object.keys(data)[0];
                setError(data[firstKey][0]);
            }
        }
        setLoading(false);
    };

    const handleGuest = async () => {
        setError("");

        setLoading(true);
        try {
            await guestLogin();
            navigate("/");
        } catch (err) {
            setError(err?.response?.data?.error);
        }
        setLoading(false);
    };

    const resetForm = (_isRegistering) => {
        setUsername("");
        setEmail("");
        setPassword("");
        setError("");
        setIsRegistering(_isRegistering);
        setLoading(false);
    };

    return (
        <div className={styles.body}>
            <div className={styles.container}>
                <h1>{isRegistering ? "Create Account" : "Login"}</h1>
                {error && <div className={styles.error}>{error}</div>}
                <form className={styles.form} onSubmit={(e) => 
                    {isRegistering ? (
                            handleRegister(e)
                        ) : (
                                handleLogin(e)
                            )
                        }
                    }
                >
                    {isRegistering && (
                        <input
                            type="username"
                            placeholder="Username"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            className={styles.input}
                            required
                        />
                    )}
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
                        {isRegistering ? (loading ? "Registering..." : "Register") : (loading ? "Logging in..." : "Login")}
                    </button>
                </form>
                <p className={styles.text}>
                    {isRegistering ? "Already have an account?" : "Don't have an account?"}
                </p>
                <p className={styles.link} onClick={() => {
                    const _isRegistering = isRegistering;
                    setIsRegistering(!_isRegistering);
                    resetForm(!_isRegistering);
                }}>
                    {isRegistering ? "Login here" : "Register here"}
                </p>
                <button type="button" className={styles.guestBtn} onClick={handleGuest}>
                    Continue as Guest
                </button>
            </div>
        </div>
    );
}

export default Login;
