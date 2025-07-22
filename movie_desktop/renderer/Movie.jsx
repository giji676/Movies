import { useLocation, useNavigate } from 'react-router-dom';
import styles from './Movie.module.css';

function Movie() {
    const location = useLocation();
    const navigate = useNavigate();

    const { tmdbConfig, movie } = location.state || {};

    if (!movie || !tmdbConfig) {
        return <p>Movie data not found.</p>;
    }

    const { title, release_date, overview, poster_path, backdrop_path } = movie;

    const backdropUrl = `${tmdbConfig.images.secure_base_url}${tmdbConfig.images.backdrop_sizes[tmdbConfig.images.backdrop_sizes.length - 1]}${backdrop_path}`;
    const posterUrl = `${tmdbConfig.images.secure_base_url}${tmdbConfig.images.poster_sizes[tmdbConfig.images.poster_sizes.length - 1]}${poster_path}`;

    return (
        <div
            className={styles.backdropContainer}
            style={{ '--backdrop': `url(${backdropUrl})` }}
        >
            <button className={styles.backButton} onClick={() => navigate(-1)}>
                ← Back
            </button>
            <div className={styles.content}>
                <img className={styles.poster} src={posterUrl} alt={title} />
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
