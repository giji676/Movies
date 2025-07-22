import { Link } from 'react-router-dom';
import styles from './MovieCard.module.css';

function MovieCard({ tmdbConfig, movie }) {
    const { title, release_date, overview, poster_path } = movie;

    return (
        <Link
            to="/movie"
            state={{ tmdbConfig, movie }}
            style={{ textDecoration: 'none', color: 'inherit' }}
        >
            <div className={styles.movie_card}>
                {movie.poster_path && (
                    <img
                        src={`${tmdbConfig.images.secure_base_url}${tmdbConfig.images.poster_sizes[tmdbConfig.images.poster_sizes.length - 1]}${poster_path}`}
                        alt={title}
                        className={styles.poster}
                    />
                )}
            </div>
        </Link>
    );
}

export default MovieCard;
