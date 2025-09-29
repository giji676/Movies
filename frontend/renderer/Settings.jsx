import { FaRegUser } from "react-icons/fa";
import styles from './Settings.module.css';
import { useAuth } from './components/AuthContext';

function Settings() {
    const { user, logout } = useAuth();

    return (
        <div className={styles.settingsBody}>
            <h1>SETTINGS</h1>
            <div className={styles.userContainer}>
                <h2>User</h2>
                {user ? (
                    <div className={styles.userData}>
                        <div>
                            <p>Username: {user.username}</p>
                            <p>Email: {user.email}</p>
                        </div>
                        {user.avatar_url ? (
                            <img src={user.avatar_url} alt="Profile" className={styles.avatar} />
                        ) : (
                                <div className={styles.avatarPlaceholderContainer}>
                                    <FaRegUser className={styles.avatarPlaceholder} />
                                </div>
                            )}
                    </div>
                ) : (
                        <p>Login</p> // TODO: add link, add css
                    )}
            </div>
            <hr className={styles.divider} />
            <div className={styles.preferencesContainer}>
                <h2>Preferences</h2>
            </div>
        </div>
    );
}

export default Settings;
