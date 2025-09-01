import { useState, useEffect } from 'react';
import api from "../main/api";
import Movies from './Movies';
import ProtectedRoute from './components/ProtectedRoute';

function WatchLater({ resetMovieListData }) {
    const BASE_URL = import.meta.env.VITE_BACKEND_URL;

    const [movies, setMovies] = useState([]);
    const [tmdbConfig, setTmdbConfig] = useState({});
    const tmdb_id = 411; // TEMP: tmdb_id of a movie to add
 
    const getWatchLater = () => {
        api
            .get("/playlist-movie/")
            .then((res) => res.data)
            .then((data) => {setMovies(data.movies)})
            .catch((err) => console.log(err));
    };

    useEffect(() => {
        getWatchLater();
    }, []);

    const saveToWatchLater = (e) => {
        e.preventDefault();
        api
            .post("/playlist-movie/", {tmdb_id})
            .then((res) => {
                if (res.status === 201) console.log("Movie added");
                else console.log("Failed to add movie");
            }).catch((err) => console.log(err));
        getWatchLater();
    }

    return (
        <ProtectedRoute>
            <form onSubmit={saveToWatchLater}>
                <input type="submit" value="submit"></input>
            </form>
            <Movies 
                searchResults={movies} 
                searchTmdbConfig={tmdbConfig} 
                resetMovieListData={resetMovieListData}
            />
        </ProtectedRoute>
    );
}

export default WatchLater;
