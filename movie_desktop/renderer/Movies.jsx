import { useState, useEffect, useRef } from 'react';
import MovieCard from "./components/MovieCard";
import style from "./Movies.module.css";

function Movies({ moviesList, moviesTmdbConfig }) {
    const BASE_URL = import.meta.env.VITE_BACKEND_URL;
    const BATCH_SIZE = 10;

    const [movies, setMovies] = useState([]);
    const [tmdbConfig, setTmdbConfig] = useState({});
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [isFetching, setIsFetching] = useState(false);
    const loader = useRef(null);

    const fetchMoviesBatch = async (currentOffset) => {
        setIsFetching(true);
        try {
            const res = await fetch(`${BASE_URL}/movie/?offset=${currentOffset}&limit=${BATCH_SIZE}`);
            const data = await res.json();

            if (currentOffset === 0) {
                setTmdbConfig(data.tmdb_config);
            }

            setMovies(prev => [...prev, ...data.movies]);

            if (data.movies.length < BATCH_SIZE) {
                setHasMore(false); // No more data to fetch
            } else {
                setOffset(prev => prev + BATCH_SIZE);
            }
        } catch (err) {
            console.error("Failed to fetch movies batch", err);
        } finally {
            setIsFetching(false);
        }
    };

    // Load initial or search data
    useEffect(() => {
        if (moviesList) {
            setMovies(moviesList);
            setTmdbConfig(moviesTmdbConfig);
            setHasMore(false);
        } else {
            fetchMoviesBatch(0);
        }
    }, [moviesList, moviesTmdbConfig]);

    // Setup infinite scroll observer
    useEffect(() => {
        if (!loader.current || !hasMore || isFetching) return;

        const observer = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting) {
                fetchMoviesBatch(offset);
            }
        });

        observer.observe(loader.current);
        return () => observer.disconnect();
    }, [loader.current, hasMore, isFetching]);

    return (
        <div className={style.movie_grid}>
            {movies.map((movie, index) => (
                <MovieCard key={index} movie={movie} tmdbConfig={tmdbConfig} />
            ))}
            {hasMore && <div ref={loader} style={{ height: "20px" }} />}
        </div>
    );
}

export default Movies;
