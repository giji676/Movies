import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Login.module.css'; // REUSING Login css.
import api from "../main/api";

function Register() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setMessage("");

        try {
            await api.register(email, username, password);
            setMessage("Registered successfully! Redirecting to login...");
            navigate("/login");
        } catch (err) {
            if (err.response && err.response.data) {
                const data = err.response.data;
                if (data.detail) {
                    setError(data.detail);
                } else if (typeof data === 'object') {
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
        <div className={styles.body}>
            <div className={styles.container}>
                <h1>Register</h1>
                {error && <div className={styles.error}>{error}</div>}
                {message && <div className={styles.message}>{message}</div>}
                <form className={styles.form} onSubmit={handleSubmit}>
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={styles.input}
                        required
                    />
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
                        required
                    />
                    <button type="submit" className={styles.button} disabled={loading}>
                        {loading ? "Registering..." : "Register"}
                    </button>
                </form>
                <p className={styles.text}>Already have an account?</p>
                <p className={styles.link} onClick={() => navigate("/login")}>
                    Login here
                </p>
            </div>
        </div>
    );
}

export default Register;
