import { useState } from 'react';
import Search from '../Search';
import UserMenu from './UserMenu';
import styles from './TopBar.module.css';

function TopBar({ setMovieListData, resetMovieListData, handleLogout, user }) {
    const [showSearchInput, setShowSearchInput] = useState(false);

    return (
        <div className={styles.topBar}>
            {(!showSearchInput || window.innerWidth > 430) && (
                <div className={styles.logo}>Movies</div>
            )}
            <div className={styles.searchWrapper}>
                <Search 
                    onResults={setMovieListData}
                    resetMovieListData={resetMovieListData}
                    showSearchInput={showSearchInput}
                    setShowSearchInput={setShowSearchInput}
                />
            </div>
            {(!showSearchInput || window.innerWidth > 430) && (
                <div className={styles.userWrapper}>
                    <UserMenu user={user} onLogout={handleLogout} />
                </div>
            )}
        </div>
    );
}

export default TopBar;
