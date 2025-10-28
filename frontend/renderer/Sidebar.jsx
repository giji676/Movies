import { NavLink } from 'react-router-dom';
import { 
    PiClockCounterClockwiseBold,
    PiDesktopBold, PiDesktopFill,
    PiBookmarkSimpleBold, PiBookmarkSimpleFill,
    PiUsersThreeBold, PiUsersThreeFill,
    PiGearSixBold, PiGearSixFill,
} from "react-icons/pi";
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
                {({ isActive }) => 
                    isActive 
                        ? (<PiDesktopFill className={styles.btnIcon}/>) 
                        : (<PiDesktopBold className={styles.btnIcon}/>)
                }
            </NavLink>
            <NavLink 
                to="/watch-history" 
                className={({ isActive }) =>
                    `${styles.button} ${isActive ? styles.active : ''}`
                }>
                    <PiClockCounterClockwiseBold className={styles.btnIcon}/>
            </NavLink>
            <NavLink 
                to="/watch-later" 
                className={({ isActive }) =>
                    `${styles.button} ${isActive ? styles.active : ''}`
                }>
                {({ isActive }) => 
                    isActive 
                        ? (<PiBookmarkSimpleFill className={styles.btnIcon}/>) 
                        : (<PiBookmarkSimpleBold className={styles.btnIcon}/>)
                }
            </NavLink>
            <NavLink 
                to="/room-access" 
                className={({ isActive }) =>
                    `${styles.button} ${isActive ? styles.active : ''}`
                }>
                {({ isActive }) => 
                    isActive 
                        ? (<PiUsersThreeFill className={styles.btnIcon}/>) 
                        : (<PiUsersThreeBold className={styles.btnIcon}/>)
                }
            </NavLink>
            <NavLink 
                to="/settings" 
                className={({ isActive }) =>
                    `${styles.button} ${isActive ? styles.active : ''}`
                }>
                {({ isActive }) => 
                    isActive 
                        ? (<PiGearSixFill className={styles.btnIcon}/>) 
                        : (<PiGearSixBold className={styles.btnIcon}/>)
                }
            </NavLink>
        </div>
    );
}

export default Sidebar;
