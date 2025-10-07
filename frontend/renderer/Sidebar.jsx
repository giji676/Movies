import { NavLink } from 'react-router-dom';
import { FaRegBookmark, FaHistory, FaCog, FaDesktop, FaUsers, } from "react-icons/fa";
import styles from './Sidebar.module.css';


function Sidebar({ resetMovieListData }) {
    return (
        <div className={styles.sidebar}>
            <h2 className={styles.logo}>🎬</h2>
            <NavLink 
                to="/" 
                onClick={() => {resetMovieListData()}} 
                className={({ isActive }) =>
                    `${styles.button} ${isActive ? styles.active : ''}`
                }>
                <FaDesktop className={styles.btnIcon}/>
            </NavLink>
            <NavLink 
                to="/watch-history" 
                className={({ isActive }) =>
                    `${styles.button} ${isActive ? styles.active : ''}`
                }>
                    <FaHistory className={styles.btnIcon}/>
            </NavLink>
            <NavLink 
                to="/watch-later" 
                className={({ isActive }) =>
                    `${styles.button} ${isActive ? styles.active : ''}`
                }>
                    <FaRegBookmark className={styles.btnIcon}/>
            </NavLink>
            <NavLink 
                to="/room-access" 
                className={({ isActive }) =>
                    `${styles.button} ${isActive ? styles.active : ''}`
                }>
                    <FaUsers className={styles.btnIcon}/>
            </NavLink>
            <NavLink 
                to="/settings" 
                className={({ isActive }) =>
                    `${styles.button} ${isActive ? styles.active : ''}`
                }>
                    <FaCog className={styles.btnIcon}/>
            </NavLink>
        </div>
    );
}

export default Sidebar;
