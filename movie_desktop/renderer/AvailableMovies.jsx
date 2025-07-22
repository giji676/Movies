import { useState, useEffect, useRef } from 'react';
import MovieCard from "./MovieCard";
import style from "./AvailableMovies.module.css";

function AvailableMovies() {
    const [movies, setMovies] = useState([]);
    const [tmdbConfig, setTmdbConfig] = useState({});
    const [visibleCount, setVisibleCount] = useState(25);
    const fetchedRef = useRef(false);
    const loader = useRef(null);

    useEffect(() => {
        if (fetchedRef.current) return;
        fetchedRef.current = true;
        getMovieData();
    }, []);

    const getMovieData = async () => {
        try {
            const response = await fetch(`http://192.168.1.215:8000/movie/`);
            const data = await response.json();
            setTmdbConfig(data.tmdb_config);
            setMovies(data.movies);
        } catch (err) {
            console.log("failed to fetch movie data", err);
        }
    };

    useEffect(() => {
        if (!loader.current) return;
        const observer = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting) {
                setVisibleCount(prev => Math.min(prev + 25, movies.length));
            }
        });
        observer.observe(loader.current);
        return () => observer.disconnect();
    }, [movies]);

    return (
        <div className={style.movie_grid}>
            {movies.slice(0, visibleCount).map((movie, index) => (
                <MovieCard key={index} movie={movie} tmdbConfig={tmdbConfig} />
            ))}
            <div ref={loader} style={{ height: "20px" }} />
        </div>
    );
}

export default AvailableMovies;
