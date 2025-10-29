import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import MovieCard from "./components/MovieCard";
import ProtectedRoute from './components/ProtectedRoute';
import styles from "./Movies.module.css";
import api from "../main/api";
import { useAuth } from "./components/AuthContext";

// TODO: movie/?offset=0&limit=10 getting called 2 times on load

function Movies({ moviesList, navOverride, room }) {
    const BASE_URL = import.meta.env.VITE_BACKEND_URL;
    const BATCH_SIZE = 10;

    const { user } = useAuth();

    const [movies, setMovies] = useState([]);
    const [watchLaterPlaylist, setWatchLaterPlaylist] = useState([]);
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [isFetching, setIsFetching] = useState(false);
    const loader = useRef(null);

    const fetchMoviesBatch = async (currentOffset) => {
        if (!user) return;
        setIsFetching(true);
        try {
            const res = await api.get(`/movie/?offset=${currentOffset}&limit=${BATCH_SIZE}`);
            const data = res.data;

            const moviesArray = Array.isArray(data.movies) ? data.movies : [];
            setMovies(prev => [...prev, ...moviesArray]);

            if (data.movies.length < BATCH_SIZE) {
                setHasMore(false);
            } else {
                setOffset(prev => prev + BATCH_SIZE);
            }
        } catch (err) {
            //toast.error("Failed to fetch movies");
        } finally {
            setIsFetching(false);
        }
    };

    const fetchWatchLaterMovies = async () => {
        if (!user) return;
        api
            .get("/playlist-movies/", { params: { watch_later: true } })
            .then((res) => res.data)
            .then((data) => {setWatchLaterPlaylist(data)})
            .catch((err) => {
                // toast.error("Failed to fetch watch later movies")
            });
    };

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
        fetchMoviesBatch(0);
    }, [user]);

    useEffect(() => {
        if (moviesList?.length > 0) {
            setMovies(moviesList);
            setHasMore(false);
        } else {
            setMovies([]);
            setOffset(0);
            fetchMoviesBatch(0);
            setHasMore(true);
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
            <div className={styles.movieGrid}>
                {movies.map((movie, index) => (
                    <div
                        key={index}
                        className={styles.card}
                    >
                        <MovieCard 
                            movie={movie} 
                            playlist={watchLaterPlaylist} 
                            onPlaylistUpdate={onPlaylistUpdate}
                            navOverride={navOverride}
                            room={room}
                        />
                    </div>
                ))}
                {hasMore && <div ref={loader} style={{ height: "20px" }} />}
            </div>
        </ProtectedRoute>
    );
}

export default Movies;
