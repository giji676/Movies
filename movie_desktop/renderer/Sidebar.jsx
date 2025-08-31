import { NavLink } from 'react-router-dom';
import styles from './Sidebar.module.css';

function Sidebar() {
    return (
        <div className={styles.sidebar}>
            <h2 className={styles.logo}>🎬</h2>
            <NavLink to="/" className={styles.button}>Dis</NavLink>
            <NavLink to="/history" className={styles.button}>His</NavLink>
            <NavLink to="/watch-later" className={styles.button}>Wat</NavLink>
            <NavLink to="/settings" className={styles.button}>Set</NavLink>
        </div>
    );
}

export default Sidebar;
