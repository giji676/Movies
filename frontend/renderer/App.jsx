import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Movie from './Movie';
import Movies from './Movies';
import Player from './Player';
import Login from './Login';
import Register from './Register';
import Sidebar from './Sidebar';
import NotFound from './NotFound';
import WatchLater from './WatchLater';
import WatchHistory from './WatchHistory';
import ProtectedRoute from './components/ProtectedRoute';
import AuthProvider from './components/AuthContext';
import TopBar from './components/TopBar';
import Settings from './Settings';
import RoomAccess from './RoomAccess';
import Room from './Room';
import styles from './App.module.css';
import './colors.css';
import api from "../main/api";

function App() {
    const [moviesList, setMoviesList] = useState(null);

    const setMovieListData = (movies) => {
        setMoviesList(movies);
    };

    const resetMovieListData = () => {
        setMoviesList(null);
    };

    return (
        <Router>
            <AuthProvider>
                <div>
                    <Routes>
                        <Route path="/" element={
                            <div className={styles.body}>
                                <Sidebar resetMovieListData={resetMovieListData} />
                                <div className={styles.mainContent}>
                                    <TopBar 
                                        setMovieListData={setMovieListData}
                                        resetMovieListData={resetMovieListData}
                                    />
                                    <div className={styles.moviesContainer}>
                                        <Movies 
                                            moviesList={moviesList} 
                                        />
                                    </div>
                                </div>
                            </div>
                        } />

                        <Route path="/login" element={
                            <div className={styles.body}>
                                <Sidebar resetMovieListData={resetMovieListData} />
                                <div className={styles.mainContent}>
                                    <Login />
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

                        <Route path="/movie" element={<Movie />} />
                        <Route path="/player" element={<Player />} />
                        <Route path="/settings" element={
                            <div className={styles.body}>
                                <Sidebar resetMovieListData={resetMovieListData} />
                                <div className={styles.mainContent}>
                                    <Settings />
                                </div>
                            </div>
                        } />
                        <Route path="/room-access" element={
                            <div className={styles.body}>
                                <Sidebar resetMovieListData={resetMovieListData} />
                                <div className={styles.mainContent}>
                                    <RoomAccess />
                                </div>
                            </div>
                        } />
                        <Route path="/room" element={
                            <div className={styles.body}>
                                <Sidebar resetMovieListData={resetMovieListData} />
                                <div className={styles.mainContent}>
                                    <Room />
                                </div>
                            </div>
                        } />
                        <Route path="/watch-later" element={
                            <div className={styles.body}>
                                <Sidebar resetMovieListData={resetMovieListData} />
                                <div className={styles.mainContent}>
                                    <TopBar 
                                        setMovieListData={setMovieListData}
                                        resetMovieListData={resetMovieListData}
                                    />
                                    <div className={styles.moviesContainer}>
                                        <WatchLater 
                                            resetMovieListData={resetMovieListData}
                                        />
                                    </div>
                                </div>
                            </div>
                        } />
                        <Route path="/watch-history" element={
                            <div className={styles.body}>
                                <Sidebar resetMovieListData={resetMovieListData} />
                                <div className={styles.mainContent}>
                                    <TopBar 
                                        setMovieListData={setMovieListData}
                                        resetMovieListData={resetMovieListData}
                                    />
                                    <div className={styles.moviesContainer}>
                                        <WatchHistory 
                                            resetMovieListData={resetMovieListData}
                                        />
                                    </div>
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
                <ToastContainer /> 
            </AuthProvider>
        </Router>
    );
}

export default App;
