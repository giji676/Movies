import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styles from './PlaylistMovieCard.module.css';
import { FaBookmark, FaRegBookmark } from "react-icons/fa";
import api from "../../main/api";

function MovieCard({ movie, playlist, onPlaylistUpdate }) {
    const { title, release_date, overview, download_path, poster_path } = movie;

    const [hovered, setHovered] = useState(false);
    const [isSaved, setIsSaved] = useState(null);
    const [playlistMovie, setPlaylistMovie] = useState(null);

    const BASE_URL = import.meta.env.VITE_BACKEND_URL;
    const MEDIA_DOWNLOADS = import.meta.env.VITE_MEDIA_DOWNLOADS;

    const posterUrl = `${BASE_URL}/${MEDIA_DOWNLOADS}/${movie.tmdb_id}/${poster_path}`;

    useEffect(() => {
        const match = playlist.find(m => m.movie.tmdb_id === movie.tmdb_id);
        if (match) {
            setIsSaved(true);
            setPlaylistMovie(match);
        } else {
            setIsSaved(false);
        }
    }, [playlist]);

    const saveToWatchLater = (e) => {
        e.preventDefault();
        api
            .patch(`/api/playlist-movie/modify/${movie.tmdb_id}/`, {
                modify_field: "watch_later",
                value: true
            })
            .then((res) => {
                if (res.status === 200 || res.status === 201) {
                    setIsSaved(true);
                    onPlaylistUpdate(res.data.data, "add");
                } else {
                    console.log("Failed to add movie");
                }
            })
            .catch((err) => console.log(err));
    };

    const deleteFromWatchLater = (e) => {
        e.preventDefault();
        api
            .patch(`/api/playlist-movie/modify/${movie.tmdb_id}/`, {
                modify_field: "watch_later",
                value: false
            })
            .then((res) => {
                if (res.status === 200) {
                    setIsSaved(false);
                    onPlaylistUpdate(playlistMovie, "delete");
                } else {
                    console.log("Unexpected response:", res.status);
                }
            })
            .catch((err) => {
                if (err.response && err.response.status === 404) {
                    setIsSaved(false);
                    onPlaylistUpdate(playlistMovie, "delete");
                } else {
                    console.log("Failed to update playlist:", err);
                }
            });
    };


    const toggleSave = (e) => {
        e.preventDefault();
        if (isSaved) {
            deleteFromWatchLater(e);
        } else {
            saveToWatchLater(e);
        }
    };

    return (
        <Link
            to="/movie"
            state={{ 
                fallbackMovie: movie,
                playlistMovie: playlistMovie || null
            }}
            style={{ textDecoration: 'none', color: 'inherit' }}
        >
            <div className={styles.movie_card}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
            >
                {poster_path && (
                    <div className={styles.imageWrapper}>
                        <img
                            loading="lazy"
                            src={posterUrl}
                            alt={movie.title}
                            className={styles.poster}
                        />
                        {(hovered || isSaved) && (
                            <button
                                className={styles.save_button}
                                onClick={toggleSave}
                                style={{ opacity: (hovered || isSaved) ? 1 : 0 }}
                            >
                                {isSaved ? 
                                    <FaBookmark className={styles.btn_icon} /> 
                                    : <FaRegBookmark className={styles.btn_icon} />}
                            </button>
                        )}
                    </div>
                )}
            </div>
        </Link>
    );
}

export default MovieCard;
