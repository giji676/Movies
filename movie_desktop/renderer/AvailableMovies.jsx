import { useState, useEffect, useRef } from 'react';
import MovieCard from "./MovieCard";

function AvailableMovies() {
    const [movies, setMovies] = useState([]);
    const [tmdbConfig, setTmdbConfig] = useState({});
    const fetchedRef = useRef(false);

    useEffect(() => {
        if (fetchedRef.current) return;
        fetchedRef.current = true;
        getMovieData();
    }, []);

    const getMovieData = async () => {
        try {
            const response = await fetch(`http://127.0.0.1:8000/movie/`);
            const data = await response.json();
            const tmdbConfig = data.tmdb_config;
            const movies = data.movies;
            setTmdbConfig(tmdbConfig);
            setMovies(movies);
        } catch (err) {
            console.log("failed to fetch movie data", err);
        }
    };

    return (
        <div>
            {movies.map((movie, index) => (
                <MovieCard key={index} movie={movie} tmdbConfig={tmdbConfig} />
            ))}
        </div>
    );
}

export default AvailableMovies;
