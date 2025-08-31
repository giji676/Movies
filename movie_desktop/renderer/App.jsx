import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import Search from './Search';
import Movie from './Movie';
import Movies from './Movies';
import Player from './Player';
import UserMenu from './UserMenu';
import Login from './Login';
import NotFound from './NotFound';
import styles from './App.module.css';
import './Colors.module.css';

function Logout() {
    localStorage.clear();
    return <Navigate to="/login" />;
}

function App() {
    const [searchResults, setSearchResults] = useState(null);
    const [searchTmdbConfig, setSearchTmdbConfig] = useState(null);
    const [user, setUser] = useState(null);

    const handleSearchResults = (movies, tmdbConfig) => {
        setSearchResults(movies);
        setSearchTmdbConfig(tmdbConfig);
    };

    const handleLogout= () => {
        localStorage.clear();
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
                                        <UserMenu user={user} onLogout={handleLogout} />
                                    </div>
                                </div>

                                <Movies 
                                    searchResults={searchResults} 
                                    searchTmdbConfig={searchTmdbConfig} 
                                />
                            </>
                        } 
                    />
                    <Route path="/login" element={<Login route="/api/token/" method="login" />} />
                    <Route path="/register" element={<Login route="api/user/register/" method="register" />} />
                    <Route path="/logout" element={<Logout />} />
                    <Route path="/movie" element={<Movie />} />
                    <Route path="/player" element={<Player />} />
                    <Route path="*" element={<NotFound />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;
