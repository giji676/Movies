import { NavLink } from 'react-router-dom';
import styles from './Sidebar.module.css';

function Sidebar({ resetMovieListData }) {
    return (
        <div className={styles.sidebar}>
            <h2 className={styles.logo}>🎬</h2>
            <NavLink to="/" onClick={() => {resetMovieListData()}} className={styles.button}>Dis</NavLink>
            <NavLink to="/history" className={styles.button}>His</NavLink>
            <NavLink to="/watch-later" className={styles.button}>Wat</NavLink>
            <NavLink to="/settings" className={styles.button}>Set</NavLink>
        </div>
    );
}

export default Sidebar;
