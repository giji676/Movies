import { useState, useEffect } from 'react';
import Search from '../Search';
import UserMenu from './UserMenu';
import styles from './TopBar.module.css';
import { useAuth } from './AuthContext';

function TopBar({ setMovieListData, resetMovieListData }) {
    const [showSearchInput, setShowSearchInput] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 600);
    const { user, logout } = useAuth();

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 600);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div className={`${styles.topBar} ${(isMobile && showSearchInput) ? (styles.expandedSearchInput) : ""}`}>
            {(!showSearchInput || !isMobile) && (
                <div className={styles.logo}>Movies</div>
            )}
            <div className={`${styles.searchWrapper} ${(isMobile && showSearchInput) ? (styles.expandedSearchInput) : ""}`}>
                <Search 
                    onResults={setMovieListData}
                    resetMovieListData={resetMovieListData}
                    showSearchInput={showSearchInput}
                    setShowSearchInput={setShowSearchInput}
                />
            </div>
            {(!showSearchInput || !isMobile) && (
                <div className={styles.userWrapper}>
                    <UserMenu />
                </div>
            )}
        </div>
    );
}

export default TopBar;
