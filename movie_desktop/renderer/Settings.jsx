import styles from './Settings.module.css';
function Settings() {
    return (
        <div className={styles.settingsBody}>
            <h1>SETTINGS</h1>
            <div className={styles.userContainer}>
                User
            </div>
            <div className={styles.preferencesContainer}>
                Preferences
            </div>
        </div>
    );
}

export default Settings;
