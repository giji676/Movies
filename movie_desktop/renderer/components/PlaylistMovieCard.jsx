import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styles from './PlaylistMovieCard.module.css';
import { FaBookmark, FaRegBookmark } from "react-icons/fa";
import api from "../../main/api";

function PlaylistMovieCard({ playlistMovie, playlist, onPlaylistUpdate }) {
    const movie = playlistMovie.movie;
    const tmdb_id = movie.tmdb_id;

    const [hovered, setHovered] = useState(false);
    const [isSaved, setIsSaved] = useState(null);

    const BASE_URL = import.meta.env.VITE_BACKEND_URL;
    const MEDIA_DOWNLOADS = import.meta.env.VITE_MEDIA_DOWNLOADS;

    const posterUrl = `${BASE_URL}/${MEDIA_DOWNLOADS}/${tmdb_id}/${movie.poster_path}`;

    useEffect(() => {
        const match = playlist.find(m => m.movie.tmdb_id === tmdb_id);
        if (match) {
            setIsSaved(true);
        } else {
            setIsSaved(false);
        }
    }, [playlist, isSaved]);

    const saveToWatchLater = (e) => {
        e.preventDefault();
        api
            .post("/playlist-movie-create/", {tmdb_id: tmdb_id})
            .then((res) => {
                if (res.status === 201) {
                    setIsSaved(true);
                    onPlaylistUpdate(res.data, "add");
                } else {
                    console.log("Failed to add movie");
                }
            }).catch((err) => console.log(err));
    }

    const deleteFromWatchLater = (e) => {
        e.preventDefault();
        api
            .delete(`/playlist-movie/delete/${tmdb_id}/`)
            .then((res) => {
                if (res.status === 204 || res.status === 200) {
                    setIsSaved(false);
                    onPlaylistUpdate(playlistMovie, "delete");
                } else if (res.status === 404) { // Not found in the database (probably already deleted)
                    setIsSaved(false);
                    onPlaylistUpdate(playlistMovie, "delete");
                } else {
                    console.log("Failed to delete movie");
                }
            })
            .catch((err) => console.log(err));
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
            <div className={styles.movie_card}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
            >
                {posterUrl && (
                    <img
                        loading="lazy"
                        src={posterUrl}
                        alt={movie.title}
                        className={styles.poster}
                    />
                )}
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
        </Link>
    );
}

export default PlaylistMovieCard;
