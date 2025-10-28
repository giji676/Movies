import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styles from './PlaylistMovieCard.module.css';
import { FaBookmark, FaRegBookmark } from "react-icons/fa";
import api from "../../main/api";
import { toast } from 'react-toastify';

function PlaylistMovieCard({ playlistMovie, playlist, onPlaylistUpdate }) {
    /*
     * playlistMovie wraps a movie, with extra user specific fields,
     * such as saved to watched later, watched time, etc.
    */
    const movie = playlistMovie.movie;
    const tmdb_id = movie.tmdb_id;

    const [hovered, setHovered] = useState(false);
    const [isSaved, setIsSaved] = useState(null);
    const [progress, setProgress] = useState(0);

    const BASE_URL = import.meta.env.VITE_BACKEND_URL;
    const MEDIA_DOWNLOADS = import.meta.env.VITE_MEDIA_DOWNLOADS;

    const posterUrl = `${MEDIA_DOWNLOADS}/${tmdb_id}/${movie.poster_path}`;

    useEffect(() => {
        const match = playlist.find(m => m.movie.tmdb_id === tmdb_id);
        if (match) {
            setIsSaved(true);
        } else {
            setIsSaved(false);
        }
    }, [playlist, isSaved]);

    useEffect(() => {
        if (playlistMovie.completed) {
            //setProgress(100);
            setProgress((playlistMovie.time_stamp / movie.duration) * 100);
        } else if (playlistMovie.time_stamp && movie.duration) {
            setProgress((playlistMovie.time_stamp / movie.duration) * 100);
        } else {
            setProgress(0);
        }
    }, []);

    const saveToWatchLater = (e) => {
        e.preventDefault();
        api
            .patch(`/playlist-movie/modify/${movie.tmdb_id}/`, {
                modify_field: "watch_later",
                value: true
            })
            .then((res) => {
                if (res.status === 200 || res.status === 201) {
                    setIsSaved(true);
                    onPlaylistUpdate(res.data.data, "add");
                } else {
                    toast.error("Failed to add movie");
                }
            })
            .catch((err) => toast.error(err));
    };

    const deleteFromWatchLater = (e) => {
        e.preventDefault();
        api
            .patch(`/playlist-movie/modify/${movie.tmdb_id}/`, {
                modify_field: "watch_later",
                value: false
            })
            .then((res) => {
                if (res.status === 200) {
                    setIsSaved(false);
                    onPlaylistUpdate(playlistMovie, "delete");
                } else {
                    toast.error("Unexpected response:", res.status);
                }
            })
            .catch((err) => {
                if (err.response && err.response.status === 404) {
                    setIsSaved(false);
                    onPlaylistUpdate(playlistMovie, "delete");
                } else {
                    toast.error("Failed to update playlist:", err);
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
            state={{ movie }}
            style={{ textDecoration: 'none', color: 'inherit' }}
        >
            <div className={styles.movieCard}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
            >
                {posterUrl && (
                    <div className={styles.imageWrapper}>
                        <img
                            loading="lazy"
                            src={posterUrl}
                            alt={movie.title}
                            className={styles.poster}
                        />
                        <div className={styles.progressBarContainer}>
                            <div className={styles.progressBar} style={{ width: `${progress}%` }} />
                        </div>
                        {(hovered || isSaved) && (
                            <button
                                className={styles.saveButton}
                                onClick={toggleSave}
                                style={{ opacity: (hovered || isSaved) ? 1 : 0 }}
                            >
                                {isSaved ? 
                                    <FaBookmark className={styles.btnIcon} /> 
                                    : <FaRegBookmark className={styles.btnIcon} />}
                            </button>
                        )}
                    </div>
                )}
            </div>
        </Link>
    );
}

export default PlaylistMovieCard;
