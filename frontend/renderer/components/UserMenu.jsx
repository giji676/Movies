import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaRegUser } from "react-icons/fa";
import Settings from '../Settings';
import styles from './UserMenu.module.css';
import { useAuth } from './AuthContext';

function UserMenu() {
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const { user, logout } = useAuth();

    const toggleDropdown = () => setOpen(!open);

    const handleLogin= () => {
        navigate("/login");
    };

    const handleLogout = async () => {
        localStorage.clear();
        navigate("/login");
    };

    const handleSettings = async () => {
        navigate("/settings");
    };

    return (
        <div className={styles.container} onClick={toggleDropdown}>
            {user ? (
                <>
                    {user.avatar_url ? (
                        <img src={user.avatar_url} alt="Profile" className={styles.avatar} />
                    ) : (
                        <FaRegUser />
                    )}
                    <span className={styles.username}>{user.username}</span>
                </>
            ) : (
                    'Login'
                )}

            {open && (
                <div className={styles.dropdown}>
                    {user ? (
                        <>
                            <div className={styles.item} onClick={handleSettings}>Settings</div>
                            <div className={styles.item} onClick={handleLogout}>Logout</div>
                        </>
                    ) : (
                            <div className={styles.item} onClick={handleLogin}>
                                Login
                            </div>
                        )}
                </div>
            )}
        </div>
    );
}

export default UserMenu;
