import { useState, useEffect } from 'react';
import api from "../main/api";
import Movies from './Movies';
import ProtectedRoute from './components/ProtectedRoute';

function WatchLater({ resetMovieListData }) {
    const BASE_URL = import.meta.env.VITE_BACKEND_URL;

    const [movies, setMovies] = useState([]);
    const [tmdbConfig, setTmdbConfig] = useState({});
 
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

    return (
        <ProtectedRoute>
            <Movies 
                searchResults={movies} 
                searchTmdbConfig={tmdbConfig} 
                resetMovieListData={resetMovieListData}
            />
        </ProtectedRoute>
    );
}

export default WatchLater;
