import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import MovieCard from "./components/MovieCard";
import ProtectedRoute from './components/ProtectedRoute';
import style from "./Movies.module.css";
import api from "../main/api";

function Movies({ moviesList }) {
    const BASE_URL = import.meta.env.VITE_BACKEND_URL;
    const BATCH_SIZE = 10;

    const [movies, setMovies] = useState([]);
    const [watchLaterPlaylist, setWatchLaterPlaylist] = useState([]);
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [isFetching, setIsFetching] = useState(false);
    const loader = useRef(null);

    const fetchMoviesBatch = async (currentOffset) => {
        alert("test");
        setIsFetching(true);
        try {
            const res = await api.get(`/movie/?offset=${currentOffset}&limit=${BATCH_SIZE}`);
            const data = res.data;

            setMovies(prev => [...prev, ...data.movies]);

            if (data.movies.length < BATCH_SIZE) {
                setHasMore(false);
            } else { setOffset(prev => prev + BATCH_SIZE);
            }
        } catch (err) {
            toast.error("Failed to fetch movies");
        } finally {
            setIsFetching(false);
        }
    };

    const fetchWatchLaterMovies = async () => {
        api
            .get("/playlist-movies/", { params: { watch_later: true } })
            .then((res) => res.data)
            .then((data) => {setWatchLaterPlaylist(data)})
            .catch((err) => toast.error("Failed to fetch watch later movies"));
    }

    const onPlaylistUpdate = (movie, action) => {
        setWatchLaterPlaylist((watchLaterPlaylist) => {
            if (action === "add") {
                if (watchLaterPlaylist.some((m) => m.movie.tmdb_id === movie.movie.tmdb_id)) {
                    return watchLaterPlaylist;
                }
                return [...watchLaterPlaylist, movie];
            } else if (action === "delete") {
                return watchLaterPlaylist.filter((m) => m.movie.tmdb_id !== movie.movie.tmdb_id);
            } else {
                return watchLaterPlaylist;
            }
        });
    };

    useEffect(() => {
        if (moviesList) {
            setMovies(moviesList);
            setHasMore(false);
        } else {
            fetchMoviesBatch(0);
        }
    }, [moviesList]);

    useEffect(() => {
        fetchWatchLaterMovies();
    }, []);

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
        <ProtectedRoute>
            <div className={style.movieGrid}>
                {movies.map((movie, index) => (
                    <MovieCard 
                        key={index} 
                        movie={movie} 
                        playlist={watchLaterPlaylist} 
                        onPlaylistUpdate={onPlaylistUpdate}
                    />
                ))}
                {hasMore && <div ref={loader} style={{ height: "20px" }} />}
            </div>
        </ProtectedRoute>
    );
}

export default Movies;
