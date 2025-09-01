import { Link } from 'react-router-dom';
import styles from './MovieCard.module.css';
import { FaBookmark } from "react-icons/fa"; // or any other icon you like
import api from "../../main/api";

function MovieCard({ tmdbConfig, movie }) {
    const { title, release_date, overview, download_path, poster_path } = movie;

    const BASE_URL = import.meta.env.VITE_BACKEND_URL;
    const MEDIA_DOWNLOADS = import.meta.env.VITE_MEDIA_DOWNLOADS;

    const posterUrl = `${BASE_URL}/${MEDIA_DOWNLOADS}/${movie.tmdb_id}/${poster_path}`;

    const saveToWatchLater = (e) => {
        e.preventDefault();
        api
            .post("/playlist-movie/", {tmdb_id: movie.tmdb_id})
            .then((res) => {
                if (res.status === 201) console.log("Movie added");
                else console.log("Failed to add movie");
            }).catch((err) => console.log(err));
    }

    return (
        <Link
            to="/movie"
            state={{ tmdbConfig, movie }}
            style={{ textDecoration: 'none', color: 'inherit' }}
        >
            <div className={styles.movie_card}>
                {poster_path && (
                    <img
                        loading="lazy"
                        src={posterUrl}
                        alt={title}
                        className={styles.poster}
                    />
                )}
                <button className={styles.save_button} onClick={saveToWatchLater}>
                    <FaBookmark />
                </button>
            </div>
        </Link>
    );
}

export default MovieCard;
