import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState } from 'react';
import Search from './Search';
import Movie from './Movie';
import Movies from './Movies';
import Player from './Player';
import UserMenu from './UserMenu';
import styles from './App.module.css';
import './Colors.module.css';

function App() {
    const [searchResults, setSearchResults] = useState(null);
    const [searchTmdbConfig, setSearchTmdbConfig] = useState(null);

    // Example user state
    const [user, setUser] = useState(null);

    const handleSearchResults = (movies, tmdbConfig) => {
        setSearchResults(movies);
        setSearchTmdbConfig(tmdbConfig);
    };

    const handleSignOut = () => {
        setUser(null);
    };

    return (
        <Router>
            <div className={styles.body}>
                <Routes>
                    <Route 
                        path="/" 
                        element={
                            <>
                                <div className={styles.topBar}>
                                    <div className={styles.logo}>
                                        Movies
                                    </div>

                                    <div className={styles.searchWrapper}>
                                        <Search onResults={handleSearchResults} />
                                    </div>

                                    <div className={styles.userWrapper}>
                                        <UserMenu user={user} onSignOut={handleSignOut} />
                                    </div>
                                </div>

                                <Movies 
                                    searchResults={searchResults} 
                                    searchTmdbConfig={searchTmdbConfig} 
                                />
                            </>
                        } 
                    />
                    <Route path="/movie" element={<Movie />} />
                    <Route path="/player" element={<Player />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;
