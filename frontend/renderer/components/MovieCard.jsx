import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styles from './PlaylistMovieCard.module.css';
import { PiBookmarkSimpleBold, PiBookmarkSimpleFill } from "react-icons/pi";
import api from "../../main/api";
import { toast } from 'react-toastify';

function MovieCard({ movie, playlist, onPlaylistUpdate, navOverride, room }) {
    const { title, release_date, overview, download_path, poster_path } = movie;

    const [hovered, setHovered] = useState(false);
    const [isSaved, setIsSaved] = useState(null);
    const [playlistMovie, setPlaylistMovie] = useState(null);

    const BASE_URL = import.meta.env.VITE_BACKEND_URL;
    const MEDIA_DOWNLOADS = import.meta.env.VITE_MEDIA_DOWNLOADS;

    const posterUrl = `${MEDIA_DOWNLOADS}/${movie.tmdb_id}/${poster_path}`;

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
            state={{ 
                movie: movie,
                navOverride: navOverride,
                room: room,
            }}
            style={{ textDecoration: 'none', color: 'inherit' }}
        >
            <div className={styles.movieCard}
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
                                className={styles.saveButton}
                                onClick={toggleSave}
                                style={{ opacity: (hovered || isSaved) ? 1 : 0 }}
                            >
                                {isSaved ? 
                                    <PiBookmarkSimpleFill className={styles.btnIcon} /> 
                                    : <PiBookmarkSimpleBold className={styles.btnIcon} />}
                            </button>
                        )}
                    </div>
                )}
            </div>
        </Link>
    );
}

export default MovieCard;
