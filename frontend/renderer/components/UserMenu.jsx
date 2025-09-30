import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaRegUser } from "react-icons/fa";
import Settings from '../Settings';
import styles from './UserMenu.module.css';
import { useAuth } from './AuthContext';

function UserMenu() {
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const { user, logout } = useAuth();
    const dropdownRef = useRef(null);

    const toggleDropdown = () => setOpen(!open);

    const handleLogin = () => {
        navigate("/login");
    };

    const handleLogout = async () => {
        logout();
        navigate("/login");
    };

    const handleSettings = async () => {
        navigate("/settings");
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                dropdownRef.current &&
                    !dropdownRef.current.contains(event.target)
            ) {
                setOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

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
                <div ref={dropdownRef} className={styles.dropdown}>
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
