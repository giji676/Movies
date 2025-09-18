import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Search from './Search';
import Movie from './Movie';
import Movies from './Movies';
import Player from './Player';
import UserMenu from './components/UserMenu';
import Login from './Login';
import Register from './Register';
import Sidebar from './Sidebar';
import NotFound from './NotFound';
import WatchLater from './WatchLater';
import WatchHistory from './WatchHistory';
import ProtectedRoute from './components/ProtectedRoute';
import Settings from './Settings';
import styles from './App.module.css';
import './colors.css';
import api from "../main/api";

function Logout() {
    localStorage.clear();
    return <Navigate to="/login" />;
}

function App() {
    const [moviesList, setMoviesList] = useState(null);
    const [user, setUser] = useState(null);
    const [showSearchInput, setShowSearchInput] = useState(false);

    const setMovieListData = (movies) => {
        setMoviesList(movies);
    };

    const resetMovieListData = () => {
        setMoviesList(null);
    };

    const handleLogout = () => {
        localStorage.clear();
        setUser(null);
    };

    const getUser = () => {
        api
            .get("/user/profile/")
            .then((res) => {
                setUser(res.data);
            })
            .catch((err) => {
                if (err.response && err.response.status !== 200) {
                    setUser(null);
                } else {
                    console.log("Failed to get user profile:", err);
                }
            });
    };

    useEffect(() => {
        getUser();
    }, []);

    return (
        <Router>
            <div>
                <Routes>
                    <Route 
                        path="/" 
                        element={
                            <ProtectedRoute>
                                <div className={styles.body}>
                                    <Sidebar resetMovieListData={resetMovieListData} />
                                    <div className={styles.mainContent}>
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

                                        <Movies 
                                            moviesList={moviesList} 
                                        />
                                    </div>
                                </div>
                            </ProtectedRoute>
                        } 
                    />

                    <Route path="/login" element={
                        <div className={styles.body}>
                            <Sidebar resetMovieListData={resetMovieListData} />
                            <div className={styles.mainContent}>
                                <Login onLoginSuccess={getUser} />
                            </div>
                        </div>
                    } />

                    <Route path="/register" element={
                        <div className={styles.body}>
                            <Sidebar resetMovieListData={resetMovieListData} />
                            <div className={styles.mainContent}>
                                <Register />
                            </div>
                        </div>
                    } />

                    <Route path="/logout" element={<Logout />} />
                    <Route path="/movie" element={<Movie />} />
                    <Route path="/player" element={<Player />} />
                    <Route path="/settings" element={
                        <div className={styles.body}>
                            <Sidebar resetMovieListData={resetMovieListData} />
                            <div className={styles.mainContent}>
                                <Settings user={user} />
                            </div>
                        </div>
                    } />
                    <Route path="/watch-later" element={
                        <div className={styles.body}>
                            <Sidebar resetMovieListData={resetMovieListData} />
                            <div className={styles.mainContent}>
                                <WatchLater resetMovieListData={resetMovieListData} />
                            </div>
                        </div>
                    } />
                    <Route path="/watch-history" element={
                        <div className={styles.body}>
                            <Sidebar resetMovieListData={resetMovieListData} />
                            <div className={styles.mainContent}>
                                <WatchHistory resetMovieListData={resetMovieListData} />
                            </div>
                        </div>
                    } />
                    <Route path="*" element={
                        <div className={styles.body}>
                            <Sidebar resetMovieListData={resetMovieListData} />
                            <div className={styles.mainContent}>
                                <NotFound />
                            </div>
                        </div>
                    } />
                </Routes>
            </div>
        </Router>
    );
}

export default App;
