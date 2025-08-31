import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
    };

    return (
        <div className={styles.container} onClick={toggleDropdown}>
            {user ? (
                <>
                    <img src={user.avatar} alt="Profile" className={styles.avatar} />
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
                            <div className={styles.item}>Settings</div>
                            <div className={styles.item} onClick={handleLogout}>
                                Logout
                            </div>
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
