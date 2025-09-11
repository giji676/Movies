import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaRegUser } from "react-icons/fa";
import styles from './UserMenu.module.css';

function UserMenu({ user }) {
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);

    const toggleDropdown = () => setOpen(!open);

    const handleLogin= () => {
        navigate("/login");
        setOpen(false);
    };

    const handleLogout = async () => {
        localStorage.clear();
        navigate("/login");
    };

    const handleSettings = async () => {
        <Route
            path="/settings"
            element={<Settings user={user} />}
        />
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
                    <span>{user.username}</span>
                </>
            ) : (
                    'Login'
                )}

            {open && (
                <div className={styles.dropdown}>
                    {user ? (
                        <>
                            <div className={styles.item}>Profile</div>
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
