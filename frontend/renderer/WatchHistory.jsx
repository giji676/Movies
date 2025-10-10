import { useState, useEffect } from 'react';
import api from "../main/api";
import styles from "./Movies.module.css";
import WatchHistoryMovieCard from './components/WatchHistoryMovieCard';
import ProtectedRoute from './components/ProtectedRoute';
import { toast } from 'react-toastify';
import { useAuth } from "./components/AuthContext";

function WatchHistoryLater({ resetMovieListData }) {
    const { user } = useAuth();
    const [movies, setMovies] = useState([]);
 
    const getWatchHistory = () => {
        if (!user) return;
        api
            .get("/playlist-movies/", { params: { watch_history: true } })
            .then((res) => res.data)
            .then((data) => {setMovies(data)})
            .catch((err) => toast.error(err));
    };

    const onPlaylistUpdate = (movie, action) => {
        setMovies((movies) => {
            if (action === "add") {
                if (movies.some((m) => m.movie.tmdb_id === movie.movie.tmdb_id)) {
                    return movies;
                }
                return [...movies, movie];
            } else if (action === "delete") {
                return movies.filter((m) => m.movie.tmdb_id !== movie.movie.tmdb_id);
            } else {
                return movies;
            }
        });
    };

    useEffect(() => {
        resetMovieListData();
        getWatchHistory();
    }, []);

    return (
        <ProtectedRoute>
            <div className={styles.movieGrid}>
                {movies.map((movie, index) => (
                    <div
                        key={index}
                        className={styles.card}
                    >
                        <WatchHistoryMovieCard  
                            playlistMovie={movie} 
                            playlist={movies} 
                            onPlaylistUpdate={onPlaylistUpdate}
                            className={styles.card}
                        />
                    </div>
                ))}
            </div>
        </ProtectedRoute>
    );
}

export default WatchHistoryLater;
