
import { useState } from 'react';
import styles from './UserMenu.module.css';

function UserMenu({ user, onSignOut }) {
    const [open, setOpen] = useState(false);

    const toggleDropdown = () => setOpen(!open);

    return (
        <div className={styles.container} onClick={toggleDropdown}>
            {user ? (
                <>
                    <img src={user.avatar} alt="Profile" className={styles.avatar} />
                    <span>Sign In</span> {/* optional text */}
                </>
            ) : (
                    'Sign In'
                )}

            {open && (
                <div className={styles.dropdown}>
                    {user ? (
                        <>
                            <div className={styles.item}>Profile</div>
                            <div className={styles.item}>Settings</div>
                            <div className={styles.item} onClick={onSignOut}>Sign Out</div>
                        </>
                    ) : (
                            <>
                                <div className={styles.item}>Sign In</div>
                                <div className={styles.item}>Register</div>
                            </>
                        )}
                </div>
            )}
        </div>
    );
}

export default UserMenu;
