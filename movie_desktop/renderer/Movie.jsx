import { useLocation, useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom'
import styles from './Movie.module.css';

function Movie() {
    const location = useLocation();
    const navigate = useNavigate();

    const BASE_URL = import.meta.env.VITE_BACKEND_URL;
    const MEDIA_DOWNLOADS = import.meta.env.VITE_MEDIA_DOWNLOADS;

    const { tmdbConfig, movie } = location.state || {};

    if (!movie || !tmdbConfig) {
        return <p>Movie data not found.</p>;
    }

    const { title, release_date, overview, poster_path, backdrop_path } = movie;

    const posterUrl = `${BASE_URL}/${MEDIA_DOWNLOADS}/${movie.tmdb_id}/${poster_path}`;
    const backdropUrl = `${BASE_URL}/${MEDIA_DOWNLOADS}/${movie.tmdb_id}/${backdrop_path}`;

    return (
        <div
            className={styles.backdropContainer}
            style={{ '--backdrop': `url(${backdropUrl})` }}
        >
            <button className={styles.backButton} onClick={() => navigate(-1)}>
                ← Back
            </button>
            <div className={styles.content}>
                <Link
                    to="/player"
                    state={{ tmdbConfig, movie }}
                    className={styles.posterWrapper}
                >
                    <img className={styles.poster} src={posterUrl} alt={title} />
                    <div className={styles.playButton}>▶</div>
                </Link>
                <div className={styles.text}>
                    <h1>{title}</h1>
                    <p><strong></strong> {release_date}</p>
                    <p>{overview}</p>
                </div>
            </div>
        </div>
    );
}

export default Movie;
