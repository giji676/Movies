import { useState, useEffect } from 'react';
import api from "../main/api";
import style from "./WatchLater.module.css";
import PlaylistMovieCard from './components/PlaylistMovieCard';
import ProtectedRoute from './components/ProtectedRoute';

function WatchLater({ resetMovieListData }) {
    const [movies, setMovies] = useState([]);
 
    const getWatchLater = () => {
        api
            .get("/playlist-movies/", { params: { watch_later: true } })
            .then((res) => res.data)
            .then((data) => {setMovies(data)})
            .catch((err) => console.log(err));
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
        getWatchLater();
    }, []);

    return (
        <ProtectedRoute>
            <div className={style.movie_grid}>
                {movies.map((movie, index) => (
                    <PlaylistMovieCard 
                        key={index} 
                        playlistMovie={movie} 
                        playlist={movies} 
                        onPlaylistUpdate={onPlaylistUpdate}
                    />
                ))}
            </div>
        </ProtectedRoute>
    );
}

export default WatchLater;
