import { Link } from 'react-router-dom';
import styles from './MovieCard.module.css';

function MovieCard({ tmdbConfig, movie }) {
    const { title, release_date, overview, download_path, poster_path } = movie;

    const BASE_URL = import.meta.env.VITE_BACKEND_URL;
    const MEDIA_DOWNLOADS = import.meta.env.VITE_MEDIA_DOWNLOADS;

    const posterUrl = `${BASE_URL}/${MEDIA_DOWNLOADS}/${movie.tmdb_id}/${poster_path}`;

    return (
        <Link
            to="/movie"
            state={{ tmdbConfig, movie }}
            style={{ textDecoration: 'none', color: 'inherit' }}
        >
            <div className={styles.movie_card}>
                {poster_path && (
                    <img
                        src={posterUrl}
                        alt={title}
                        className={styles.poster}
                    />
                )}
            </div>
        </Link>
    );
}

export default MovieCard;
